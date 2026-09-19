<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Atencion;
use App\Models\TicketTermico;
use App\Services\ESCPOSService;
use Illuminate\Http\Request;

class TicketController extends Controller
{
    public function __construct(private ESCPOSService $escpos) {}

    public function generate(Request $request)
    {
        $request->validate([
            'atencion_id' => 'required|exists:atenciones,id',
            'tipo'        => 'required|in:admision,receta,referencia,cierre',
            'printer_id'  => 'nullable|string',
        ]);

        $atencion = Atencion::with(['beneficiario','campaign','triaje','consulta.medico'])->findOrFail($request->atencion_id);

        $escposBase64 = match ($request->tipo) {
            'receta'   => $this->escpos->buildRecetaTicket($atencion),
            'admision' => $this->escpos->buildAdmisionTicket($atencion),
            default    => $this->escpos->buildAdmisionTicket($atencion),
        };

        $ticket = TicketTermico::create([
            'atencion_id'   => $atencion->id,
            'tipo'          => $request->tipo,
            'printer_id'    => $request->printer_id ?? 'BT-POS-01',
            'escpos_base64' => $escposBase64,
            'printed_by'    => $request->user()->id,
        ]);

        return response()->json([
            'ticket_id'      => $ticket->id,
            'tipo'           => $ticket->tipo,
            'escpos_base64'  => $escposBase64,
            'printed'        => false,
        ], 201);
    }

    public function historial(Atencion $atencion)
    {
        return response()->json($atencion->tickets()->with('printedBy')->get());
    }

    public function printerStatus()
    {
        return response()->json([
            'printers' => [
                ['id' => 'BT-POS-01', 'name' => 'Impresora Térmica BT', 'connected' => true, 'paper_ok' => true],
            ]
        ]);
    }
}
