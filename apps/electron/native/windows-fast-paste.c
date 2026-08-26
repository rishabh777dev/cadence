/**
 * Windows Fast Paste and Fast Copy
 *
 * Injects Ctrl+V (or Ctrl+Shift+V for terminals) or Ctrl+C.
 * Uses keybd_event (bypasses UIPI) with hardware scan codes and SendInput.
 *
 * Usage: windows-fast-paste.exe [--terminal] [--copy]
 */

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <stdio.h>
#include <string.h>

int main(int argc, char* argv[]) {
    int use_shift = 0;
    int is_copy = 0;

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--terminal") == 0) {
            use_shift = 1;
        } else if (strcmp(argv[i], "--copy") == 0) {
            is_copy = 1;
        }
    }

    BYTE target_vk = is_copy ? 'C' : 'V';
    BYTE target_scan = (BYTE)MapVirtualKey(target_vk, MAPVK_VK_TO_VSC);
    BYTE ctrl_scan = (BYTE)MapVirtualKey(VK_CONTROL, MAPVK_VK_TO_VSC);
    BYTE shift_scan = (BYTE)MapVirtualKey(VK_SHIFT, MAPVK_VK_TO_VSC);

    /* Release Alt, Shift, and Win modifiers if held so Ctrl+V isn't turned into Alt+Ctrl+V */
    keybd_event(VK_MENU, (BYTE)MapVirtualKey(VK_MENU, MAPVK_VK_TO_VSC), KEYEVENTF_KEYUP, 0);
    keybd_event(VK_LMENU, (BYTE)MapVirtualKey(VK_LMENU, MAPVK_VK_TO_VSC), KEYEVENTF_KEYUP, 0);
    keybd_event(VK_RMENU, (BYTE)MapVirtualKey(VK_RMENU, MAPVK_VK_TO_VSC), KEYEVENTF_KEYUP, 0);
    if (!use_shift) {
        keybd_event(VK_SHIFT, shift_scan, KEYEVENTF_KEYUP, 0);
        keybd_event(VK_LSHIFT, shift_scan, KEYEVENTF_KEYUP, 0);
        keybd_event(VK_RSHIFT, shift_scan, KEYEVENTF_KEYUP, 0);
    }
    keybd_event(VK_LWIN, (BYTE)MapVirtualKey(VK_LWIN, MAPVK_VK_TO_VSC), KEYEVENTF_KEYUP, 0);
    keybd_event(VK_RWIN, (BYTE)MapVirtualKey(VK_RWIN, MAPVK_VK_TO_VSC), KEYEVENTF_KEYUP, 0);

    /* Direct keybd_event synthesis: works across all Windows versions and UIPI levels */
    keybd_event(VK_CONTROL, ctrl_scan, 0, 0);
    if (use_shift) {
        keybd_event(VK_SHIFT, shift_scan, 0, 0);
    }

    keybd_event(target_vk, target_scan, 0, 0);
    keybd_event(target_vk, target_scan, KEYEVENTF_KEYUP, 0);

    if (use_shift) {
        keybd_event(VK_SHIFT, shift_scan, KEYEVENTF_KEYUP, 0);
    }
    keybd_event(VK_CONTROL, ctrl_scan, KEYEVENTF_KEYUP, 0);

    return 0;
}
