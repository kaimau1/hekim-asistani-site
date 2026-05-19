import json
import os
import sys
import tkinter as tk
from tkinter import messagebox
import winreg


REG_KEYS = [
    r"Software\Google\Chrome\NativeMessagingHosts\com.recete.yazici",
    r"Software\BraveSoftware\Brave-Browser\NativeMessagingHosts\com.recete.yazici",
    r"Software\Microsoft\Edge\NativeMessagingHosts\com.recete.yazici",
]


def _kendi_klasoru():
    kaynak = sys.executable if getattr(sys, "frozen", False) else os.path.abspath(sys.argv[0])
    return os.path.dirname(os.path.abspath(kaynak))


def _manifest_yolu_oku(reg_yolu):
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, reg_yolu, 0, winreg.KEY_READ) as anahtar:
            deger, _ = winreg.QueryValueEx(anahtar, "")
            if deger:
                return deger
    except OSError:
        return None
    return None


def _dosya_sil(yol):
    try:
        if yol and os.path.exists(yol):
            os.remove(yol)
            return True
    except OSError:
        pass
    return False


def _registry_key_sil(reg_yolu):
    try:
        winreg.DeleteKey(winreg.HKEY_CURRENT_USER, reg_yolu)
        return True
    except OSError:
        return False


def ana():
    klasor = _kendi_klasoru()
    manifest_yollari = set()
    host_yollari = set()

    for reg_yolu in REG_KEYS:
        manifest_yolu = _manifest_yolu_oku(reg_yolu)
        if manifest_yolu:
            manifest_yollari.add(manifest_yolu)
        _registry_key_sil(reg_yolu)

    yerel_manifest = os.path.join(klasor, "com.recete.yazici.json")
    if os.path.exists(yerel_manifest):
        manifest_yollari.add(yerel_manifest)

    for manifest_yolu in list(manifest_yollari):
        try:
            with open(manifest_yolu, "r", encoding="utf-8") as f:
                veri = json.load(f)
            host_yolu = veri.get("path")
            if host_yolu:
                host_yollari.add(host_yolu)
        except Exception:
            pass
        _dosya_sil(manifest_yolu)

    # Bildiğimiz host dosyalarını da kaldır
    for host_yolu in list(host_yollari):
        _dosya_sil(host_yolu)

    # Eski veya yan dosyalar kalmış olabilir
    _dosya_sil(os.path.join(klasor, "yazici_hata.log"))
    _dosya_sil(os.path.join(klasor, "HekimPlus_YaziciKurulum.exe"))

    root = tk.Tk()
    root.withdraw()
    messagebox.showinfo(
        "Ahek Plus",
        "Kurulum kaldırıldı.\n\nYazıcı bağlantısı bu bilgisayardan temizlendi."
    )


if __name__ == "__main__":
    ana()
