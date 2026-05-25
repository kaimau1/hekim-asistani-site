import sys
import json
import struct
import os
import logging
import numpy as np
import qrcode
import win32print
from PIL import Image, ImageDraw, ImageFont

YAZICI_GENISLIK = 384  # 58mm @ 203dpi

# ── Hata logu ─────────────────────────────────────────────────
_log_dosya = os.path.join(os.path.dirname(os.path.abspath(sys.argv[0])), 'yazici_hata.log')
logging.basicConfig(
    filename=_log_dosya,
    level=logging.ERROR,
    format='%(asctime)s %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

def log_hata(mesaj):
    logging.error(mesaj)
    sys.stderr.write(mesaj + '\n')

# ── Font cache ────────────────────────────────────────────────
_font_cache = {}

def get_font(boyut, kalin=True):
    key = (boyut, kalin)
    if key not in _font_cache:
        yol = "C:/Windows/Fonts/arialbd.ttf" if kalin else "C:/Windows/Fonts/arial.ttf"
        try:
            _font_cache[key] = ImageFont.truetype(yol, boyut)
        except Exception:
            _font_cache[key] = ImageFont.load_default()
    return _font_cache[key]


def img_to_escpos(img):
    """PIL görüntüsünü ESC/POS raster byte dizisine çevirir (numpy hızlı)."""
    img = img.convert('L')
    width, height = img.size
    width_bytes = (width + 7) // 8
    padded = width_bytes * 8

    arr = np.frombuffer(img.tobytes(), dtype=np.uint8).reshape(height, width)
    # sağa sıfır dolgu
    if padded > width:
        arr = np.pad(arr, ((0, 0), (0, padded - width)),
                     mode='constant', constant_values=255)
    # koyu piksel (< 128) → 1, açık → 0
    bits = (arr < 128).astype(np.uint8)
    # 8'li gruplara böl ve bit paketleme
    bits = bits.reshape(height, width_bytes, 8)
    weights = np.array([128, 64, 32, 16, 8, 4, 2, 1], dtype=np.uint8)
    packed = (bits * weights).sum(axis=2, dtype=np.uint8)

    header = bytes([0x1d, 0x76, 0x30, 0x00,
                    width_bytes & 0xff, (width_bytes >> 8) & 0xff,
                    height & 0xff, (height >> 8) & 0xff])
    return header + packed.tobytes()


def kod_qr_olustur(kod, boyut):
    """Reçete kodundan QR kod görüntüsü üretir."""
    qr = qrcode.QRCode(version=None, box_size=3, border=2,
                       error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(kod)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert('L')
    img = img.resize((boyut, boyut), Image.NEAREST)
    return img

def render_barkod_satiri(kod, tc='', qr2_b64=None, qr_boyut=110, font_boyut_max=50, etiket_font_boyut=13, yazici_genislik=None, layout=None):
    """Sol QR | Barkod kodu | Sağ QR → tek ESC/POS görüntüsü.
    layout: özel yerleşim pozisyonları dict'i (solQR, sagQR, barkodKod)."""
    W = yazici_genislik or YAZICI_GENISLIK
    orta_genislik = W - 2 * qr_boyut - 8

    # Yazı tipi boyutunu font_boyut_max'tan başlatıp orta alana sığana kadar küçült
    font = None
    font_boyut = max(14, font_boyut_max)
    char_widths = []
    while font_boyut >= 14:
        f = get_font(font_boyut, kalin=True)
        cw = []
        for c in kod:
            try:
                bbox = f.getbbox(c)
                cw.append(bbox[2] - bbox[0])
            except Exception:
                cw.append(font_boyut // 2)
        if sum(cw) <= orta_genislik:
            font = f
            char_widths = cw
            break
        font_boyut -= 2

    if font is None:
        font = get_font(14, kalin=True)
        char_widths = [8] * len(kod)

    etiket_font = get_font(etiket_font_boyut, kalin=False)
    etiket_yukseklik = 18  # QR altındaki etiket için ek alan

    # Canvas yüksekliği: QR + etiket veya yazı hangisi büyükse
    yukseklik = max(qr_boyut + etiket_yukseklik, font_boyut + 20)
    canvas = Image.new('L', (W, yukseklik), 255)
    draw = ImageDraw.Draw(canvas)

    # Layout pozisyonlarını belirle
    lp = layout or {}
    sol_qr_x = int(lp['solQR']['x']) if lp.get('solQR') and lp['solQR'].get('x', -1) >= 0 else 0
    sol_qr_y = int(lp['solQR']['y']) if lp.get('solQR') and lp['solQR'].get('y', -1) >= 0 else 0
    sag_qr_x = int(lp['sagQR']['x']) if lp.get('sagQR') and lp['sagQR'].get('x', -1) >= 0 else W - qr_boyut
    sag_qr_y = int(lp['sagQR']['y']) if lp.get('sagQR') and lp['sagQR'].get('y', -1) >= 0 else 0

    # Sol QR — TC numarasından üret
    if tc:
        try:
            qr1 = kod_qr_olustur(tc, qr_boyut)
            canvas.paste(qr1, (sol_qr_x, sol_qr_y))
        except Exception as e:
            log_hata(f"TC QR hatası: {e}")
    # "TC" etiketi - sol QR altında ortalı
    try:
        tb = etiket_font.getbbox("TC")
        tw = tb[2] - tb[0]
    except Exception:
        tw = 20
    draw.text((sol_qr_x + (qr_boyut - tw) // 2, sol_qr_y + qr_boyut + 2), "TC", font=etiket_font, fill=0)

    # Sağ QR — reçete kodundan üretilir
    try:
        qr2 = kod_qr_olustur(kod, qr_boyut)
        canvas.paste(qr2, (sag_qr_x, sag_qr_y))
    except Exception as e:
        log_hata(f"QR2 üretme hatası: {e}")
    # "Recete Kodu" etiketi - sağ QR altında ortalı
    etiket2 = "Reçete Kodu"
    try:
        tb2 = etiket_font.getbbox(etiket2)
        tw2 = tb2[2] - tb2[0]
    except Exception:
        tw2 = 70
    draw.text((sag_qr_x + (qr_boyut - tw2) // 2, sag_qr_y + qr_boyut + 2), etiket2, font=etiket_font, fill=0)

    # Barkod kodu pozisyonu
    toplam_w = sum(char_widths)
    if lp.get('barkodKod') and lp['barkodKod'].get('x', -1) >= 0:
        # Özel pozisyon (center-based: x merkezden başlar)
        bk_center_x = int(lp['barkodKod']['x'])
        bk_center_y = int(lp['barkodKod']['y'])
        x = bk_center_x - toplam_w // 2
        y = bk_center_y - font_boyut // 2
    else:
        # Varsayılan: QR'lar arasında ortalı
        orta_x_bas = qr_boyut + 4
        x = orta_x_bas + max(0, (orta_genislik - toplam_w) // 2)
        y = (qr_boyut - font_boyut) // 2

    for i, c in enumerate(kod):
        w = char_widths[i]
        draw.text((x, y), c, font=font, fill=0)
        if c.isdigit():
            draw.line([(x, y + font_boyut + 2), (x + w, y + font_boyut + 2)], fill=0, width=2)
        x += w

    return img_to_escpos(canvas)


def render_isim(ad_soyad, isim_boyut=2, yazici_genislik=None, layout=None):
    """Hasta adını PIL ile render eder → ESC/POS (Türkçe tam destek).
    İstenen boyuttan başlar, kağıda sığana kadar küçültür.
    layout: özel yerleşim pozisyonları dict'i (hastaAdi)."""
    W = yazici_genislik or YAZICI_GENISLIK
    boyut_max = 24 * max(1, min(4, isim_boyut))
    sinir = W - 8  # küçük kenar boşluğu

    font = None
    font_boyut = boyut_max
    bbox = None
    dummy_draw = ImageDraw.Draw(Image.new('L', (1, 1)))

    while font_boyut >= 12:
        f = get_font(font_boyut, kalin=True)
        b = dummy_draw.textbbox((0, 0), ad_soyad, font=f)
        if (b[2] - b[0]) <= sinir:
            font = f
            bbox = b
            break
        font_boyut -= 2

    if font is None:
        font = get_font(12, kalin=True)
        bbox = dummy_draw.textbbox((0, 0), ad_soyad, font=font)

    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    pad = 4
    canvas = Image.new('L', (W, th + pad * 2), 255)
    draw = ImageDraw.Draw(canvas)

    # Layout pozisyonu: hastaAdi.x varsa onu kullan (center-based)
    lp = layout or {}
    if lp.get('hastaAdi') and lp['hastaAdi'].get('x', -1) >= 0:
        x = int(lp['hastaAdi']['x']) - tw // 2 - bbox[0]
    else:
        x = max(0, (W - tw) // 2) - bbox[0]

    draw.text((x, pad - bbox[1]), ad_soyad, font=font, fill=0)
    return img_to_escpos(canvas)


def yazdir(kod, ad_soyad='', tc='', qr2='', yazici_adi='POS-58',
           qr_boyut=110, font_boyut_max=50, etiket_font=13, isim_boyut=2, yazici_genislik=384, layout=None):
    try:
        printer = win32print.OpenPrinter(yazici_adi or 'POS-58')
        win32print.StartDocPrinter(printer, 1, ("Recete", None, "RAW"))
        win32print.StartPagePrinter(printer)

        init  = b'\x1b\x40'
        feed  = b'\x1b\x64\x05'
        cut   = b'\x1d\x56\x00'

        data  = init

        # QR sol | Barkod kodu | QR sağ → tek görüntü
        data += render_barkod_satiri(kod, tc=tc, qr2_b64=qr2,
                                     qr_boyut=qr_boyut,
                                     font_boyut_max=font_boyut_max,
                                     etiket_font_boyut=etiket_font,
                                     yazici_genislik=yazici_genislik,
                                     layout=layout)
        data += b'\n'

        # Hasta adı — PIL ile render (Türkçe tam destek)
        if ad_soyad:
            data += render_isim(ad_soyad, isim_boyut, yazici_genislik=yazici_genislik, layout=layout)
            data += b'\n'

        data += feed + cut

        win32print.WritePrinter(printer, data)
        win32print.EndPagePrinter(printer)
        win32print.EndDocPrinter(printer)
        win32print.ClosePrinter(printer)
        return True
    except Exception as e:
        log_hata(f"Yazıcı hatası: {e}")
        return False


def read_message():
    """Native messaging protokolü: 4-byte LE uzunluk + UTF-8 JSON oku."""
    raw_len = sys.stdin.buffer.read(4)
    if not raw_len or len(raw_len) < 4:
        return None
    msg_len = struct.unpack('<I', raw_len)[0]
    raw_msg = sys.stdin.buffer.read(msg_len)
    return json.loads(raw_msg.decode('utf-8'))


def send_message(data):
    """Native messaging protokolü: 4-byte LE uzunluk + UTF-8 JSON yaz."""
    encoded = json.dumps(data).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('<I', len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()


def main():
    while True:
        try:
            msg = read_message()
            if msg is None:
                break

            # Ping - bağlantı testi
            if msg.get('type') == 'ping':
                send_message({'durum': 'pong'})
                continue

            # Yazıcı listesi
            if msg.get('type') == 'yazicilariGetir':
                try:
                    printers = win32print.EnumPrinters(
                        win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS
                    )
                    isimler = [p[2] for p in printers]
                    varsayilan = win32print.GetDefaultPrinter()
                except Exception as e:
                    isimler = []
                    varsayilan = ''
                send_message({'durum': 'ok', 'yazicilar': isimler, 'varsayilan': varsayilan})
                continue

            kod              = msg.get('kod', '')
            ad_soyad         = msg.get('ad_soyad', '')
            tc               = msg.get('tc', '')
            qr2              = msg.get('qr2', '')
            yazici_adi       = msg.get('yazici_adi', 'POS-58')
            qr_boyut         = int(msg.get('qr_boyut', 110))
            font_boyut_max   = int(msg.get('font_boyut_max', 50))
            etiket_font      = int(msg.get('etiket_font', 13))
            isim_boyut       = float(msg.get('isim_boyut', 2))
            yazici_genislik  = int(msg.get('kagit_genislik', 384))
            layout_data      = msg.get('layout', None)

            if kod:
                basarili = yazdir(kod, ad_soyad, tc, qr2, yazici_adi,
                                  qr_boyut, font_boyut_max, etiket_font, isim_boyut,
                                  yazici_genislik, layout=layout_data)
                send_message({'durum': 'ok' if basarili else 'hata'})
            else:
                send_message({'durum': 'kod yok'})

        except Exception as e:
            log_hata(f"Host hatası: {e}")
            try:
                send_message({'durum': 'hata', 'mesaj': str(e)})
            except Exception:
                pass
            break


def auto_kurulum():
    """Double-click ile çalıştırıldığında native messaging host'u kaydet."""
    import winreg, tkinter as tk
    from tkinter import messagebox

    EXT_ID = 'dbodkaociggagccjjnobjefpjhpmkjif'

    # Kurulum dosyasının bulunduğu klasör: EXE'yi nereye indirdiyseniz orası.
    kurulum_dosyasi = sys.executable if getattr(sys, 'frozen', False) else os.path.abspath(sys.argv[0])
    exe_yol = os.path.abspath(kurulum_dosyasi)
    kurulum_dir = os.path.dirname(exe_yol)
    json_yol = os.path.join(kurulum_dir, 'com.recete.yazici.json')

    manifest = {
        "name": "com.recete.yazici",
        "description": "Recete termal yazici native host",
        "path": exe_yol,
        "type": "stdio",
        "allowed_origins": [f"chrome-extension://{EXT_ID}/"]
    }
    with open(json_yol, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    reg_key = r"Software\Google\Chrome\NativeMessagingHosts\com.recete.yazici"
    try:
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, reg_key) as k:
            winreg.SetValueEx(k, '', 0, winreg.REG_SZ, json_yol)
        # Brave ve Edge için de kaydet
        for tarayici in [
            r"Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.recete.yazici",
            r"Software\Microsoft\Edge\NativeMessagingHosts\com.recete.yazici",
        ]:
            try:
                with winreg.CreateKey(winreg.HKEY_CURRENT_USER, tarayici) as k:
                    winreg.SetValueEx(k, '', 0, winreg.REG_SZ, json_yol)
            except Exception:
                pass
        root = tk.Tk(); root.withdraw()
        messagebox.showinfo(
            "Ahek Plus — Kurulum",
            "✓ Yazıcı kurulumu tamamlandı!\n\nTarayıcıyı yeniden başlatın veya "
            "eklentiyi kapatıp tekrar açın."
        )
    except Exception as e:
        root = tk.Tk(); root.withdraw()
        messagebox.showerror("Hata", f"Kayıt başarısız:\n{e}")


if __name__ == '__main__':
    # Chrome native messaging: argv[1] "chrome-extension://..." içerir
    if len(sys.argv) > 1 and 'chrome-extension://' in sys.argv[1]:
        main()
    else:
        auto_kurulum()
