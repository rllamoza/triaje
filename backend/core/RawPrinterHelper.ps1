param (
    [string]$PrinterName = "",
    [string]$Base64Data = "",
    [string]$FilePath = "",
    [string]$DocName = "Ticket Clinico Semilla"
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$localTemp = [System.IO.Path]::Combine($PSScriptRoot, "temp")
if (-not (Test-Path $localTemp)) {
    New-Item -ItemType Directory -Path $localTemp -Force | Out-Null
}
$env:TEMP = $localTemp
$env:TMP = $localTemp

if (-not ([System.Management.Automation.PSTypeName]'RawPrinterHelper').Type) {
    $csharpCode = @"
using System;
using System.IO;
using System.Runtime.InteropServices;

public class RawPrinterHelper {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    public static bool SendBytesToPrinter(string szPrinterName, byte[] bytes, string docName = "Ticket Semilla") {
        IntPtr hPrinter = IntPtr.Zero;
        DOCINFOA di = new DOCINFOA();
        di.pDocName = docName;
        di.pDataType = "RAW";

        if (!OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero)) {
            int err = Marshal.GetLastWin32Error();
            throw new Exception("No se pudo abrir la impresora '" + szPrinterName + "'. Error Win32: " + err);
        }

        bool success = false;
        try {
            if (StartDocPrinter(hPrinter, 1, di)) {
                try {
                    if (StartPagePrinter(hPrinter)) {
                        IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
                        Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);
                        int dwWritten = 0;
                        success = WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out dwWritten);
                        Marshal.FreeCoTaskMem(pUnmanagedBytes);
                        EndPagePrinter(hPrinter);
                    }
                } finally {
                    EndDocPrinter(hPrinter);
                }
            }
        } finally {
            ClosePrinter(hPrinter);
        }
        return success;
    }
}
"@
    Add-Type -TypeDefinition $csharpCode -Language CSharp
}

# Auto-detect Epson T88 if printer name is empty or generic
if ([string]::IsNullOrWhiteSpace($PrinterName) -or $PrinterName -eq "auto" -or $PrinterName -like "*T88*") {
    $printers = Get-Printer | Where-Object { $_.Name -like "*T88*" -or $_.Name -like "*TM-T*" -or $_.DriverName -like "*T88*" -or $_.Name -like "*EPSON*" }
    if ($printers) {
        $PrinterName = ($printers | Select-Object -First 1).Name
    } else {
        $defaultPrinter = Get-Printer | Where-Object { $_.Default -eq $true } | Select-Object -First 1
        if ($defaultPrinter) {
            $PrinterName = $defaultPrinter.Name
        } else {
            throw "No se encontró ninguna impresora Epson TM-T88 ni impresora predeterminada."
        }
    }
}

[byte[]]$bytesToPrint = $null

if (-not [string]::IsNullOrWhiteSpace($Base64Data)) {
    $bytesToPrint = [Convert]::FromBase64String($Base64Data)
} elseif (-not [string]::IsNullOrWhiteSpace($FilePath) -and (Test-Path $FilePath)) {
    $bytesToPrint = [System.IO.File]::ReadAllBytes($FilePath)
} else {
    throw "Debe proporcionar Base64Data o un FilePath válido."
}

$result = [RawPrinterHelper]::SendBytesToPrinter($PrinterName, $bytesToPrint, $DocName)

[PSCustomObject]@{
    Success = $result
    Printer = $PrinterName
    BytesCount = $bytesToPrint.Length
    Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
} | ConvertTo-Json -Compress
