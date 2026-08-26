using System;
using System.Globalization;
using System.Runtime.InteropServices;

namespace WindowsOutputVolume
{
    [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IAudioEndpointVolume
    {
        int RegisterControlChangeNotify(IntPtr pNotify);
        int UnregisterControlChangeNotify(IntPtr pNotify);
        int GetChannelCount(out uint pnChannelCount);
        int SetMasterVolumeLevel(float fLevelDB, ref Guid pguidEventContext);
        int SetMasterVolumeLevelScalar(float fLevel, ref Guid pguidEventContext);
        int GetMasterVolumeLevel(out float pfLevelDB);
        int GetMasterVolumeLevelScalar(out float pfLevel);
        int SetChannelVolumeLevel(uint nChannel, float fLevelDB, ref Guid pguidEventContext);
        int SetChannelVolumeLevelScalar(uint nChannel, float fLevel, ref Guid pguidEventContext);
        int GetChannelVolumeLevel(uint nChannel, out float pfLevelDB);
        int GetChannelVolumeLevelScalar(uint nChannel, out float pfLevel);
        int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, ref Guid pguidEventContext);
        int GetMute([MarshalAs(UnmanagedType.Bool)] out bool pbMute);
        int GetVolumeStepInfo(out uint pnStep, out uint pnStepCount);
        int VolumeStepUp(ref Guid pguidEventContext);
        int VolumeStepDown(ref Guid pguidEventContext);
        int QueryHardwareSupport(out uint pdwHardwareSupportMask);
        int GetVolumeRange(out float pflVolumeMindB, out float pflVolumeMaxdB, out float pflVolumeIncrementdB);
    }

    [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IMMDevice
    {
        int Activate(ref Guid id, int clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object interfacePointer);
        int OpenPropertyStore(int stgmAccess, out IntPtr ppProperties);
        int GetId([MarshalAs(UnmanagedType.LPWStr)] out string ppstrId);
        int GetState(out int pdwState);
    }

    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    internal interface IMMDeviceEnumerator
    {
        int EnumAudioEndpoints(int dataFlow, int dwStateMask, out IntPtr ppDevices);
        int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppEndpoint);
        int GetDevice([MarshalAs(UnmanagedType.LPWStr)] string pwstrId, out IMMDevice ppDevice);
        int RegisterEndpointNotificationCallback(IntPtr pClient);
        int UnregisterEndpointNotificationCallback(IntPtr pClient);
    }

    [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
    internal class MMDeviceEnumeratorComObject { }

    internal class Program
    {
        private static int Main(string[] args)
        {
            try
            {
                if (args.Length == 1 && args[0] == "get")
                {
                    return CommandGet();
                }
                if ((args.Length == 2 || args.Length == 3) && args[0] == "set")
                {
                    return CommandSet(args[1], args.Length == 3 ? args[2] : null);
                }

                Console.Error.WriteLine("usage: windows-output-volume get | set <volume> [deviceId]");
                return 1;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("error: " + ex.Message);
                return 1;
            }
        }

        private static int CommandGet()
        {
            var enumerator = (IMMDeviceEnumerator)new MMDeviceEnumeratorComObject();
            IMMDevice device;
            int hr = enumerator.GetDefaultAudioEndpoint(0, 1, out device); // eRender=0, eMultimedia=1
            if (hr != 0 || device == null)
            {
                Console.Error.WriteLine("failed to get default audio endpoint");
                return 1;
            }

            string deviceId;
            device.GetId(out deviceId);

            Guid iid = typeof(IAudioEndpointVolume).GUID;
            object endpointObj;
            hr = device.Activate(ref iid, 23, IntPtr.Zero, out endpointObj); // CLSCTX_ALL = 23
            if (hr != 0 || endpointObj == null)
            {
                Console.Error.WriteLine("failed to activate endpoint volume");
                return 1;
            }

            var endpoint = (IAudioEndpointVolume)endpointObj;
            float volume;
            hr = endpoint.GetMasterVolumeLevelScalar(out volume);
            if (hr != 0)
            {
                Console.Error.WriteLine("failed to read endpoint volume");
                return 1;
            }

            string escapedId = (deviceId ?? "").Replace("\\", "\\\\").Replace("\"", "\\\"");
            string volStr = volume.ToString("0.######", CultureInfo.InvariantCulture);
            Console.WriteLine("{\"deviceId\":\"" + escapedId + "\",\"volume\":" + volStr + "}");
            return 0;
        }

        private static int CommandSet(string volumeArg, string deviceIdArg)
        {
            float targetVol;
            if (!float.TryParse(volumeArg, NumberStyles.Float, CultureInfo.InvariantCulture, out targetVol) || targetVol < 0.0f || targetVol > 1.0f)
            {
                Console.Error.WriteLine("volume must be a number between 0 and 1");
                return 1;
            }

            var enumerator = (IMMDeviceEnumerator)new MMDeviceEnumeratorComObject();
            IMMDevice device;
            int hr;

            if (!string.IsNullOrEmpty(deviceIdArg))
            {
                hr = enumerator.GetDevice(deviceIdArg, out device);
            }
            else
            {
                hr = enumerator.GetDefaultAudioEndpoint(0, 1, out device);
            }

            if (hr != 0 || device == null)
            {
                Console.Error.WriteLine("failed to get audio endpoint");
                return 1;
            }

            Guid iid = typeof(IAudioEndpointVolume).GUID;
            object endpointObj;
            hr = device.Activate(ref iid, 23, IntPtr.Zero, out endpointObj);
            if (hr != 0 || endpointObj == null)
            {
                Console.Error.WriteLine("failed to activate endpoint volume");
                return 1;
            }

            var endpoint = (IAudioEndpointVolume)endpointObj;
            Guid empty = Guid.Empty;
            hr = endpoint.SetMasterVolumeLevelScalar(targetVol, ref empty);
            if (hr != 0)
            {
                Console.Error.WriteLine("failed to set endpoint volume");
                return 1;
            }

            string targetStr = targetVol.ToString("0.######", CultureInfo.InvariantCulture);
            Console.WriteLine("{\"volume\":" + targetStr + "}");
            return 0;
        }
    }
}
