import { NextRequest, NextResponse } from 'next/server';
import { processMtnMomoWebhook, MtnWebhookPayload } from '@/lib/payments/mtnMomo';

/**
 * Route Webhook pour MTN Mobile Money Congo-Brazzaville
 * Endpoint: POST /api/webhooks/mtn-momo
 * Traitement strictement idempotent des accusés de paiement
 */
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-momo-signature') || req.headers.get('authorization');
    const idempotencyHeader = req.headers.get('x-idempotency-key') || req.headers.get('x-reference-id');

    // Récupération du corps de la requête
    const body = await req.json();

    const payload: MtnWebhookPayload = {
      transactionId: body.transactionId || body.externalId || body.id,
      reference: body.reference || body.clientReference || `MTN-CG-${Date.now()}`,
      status: body.status || 'SUCCESSFUL',
      amount: Number(body.amount) || 0,
      currency: body.currency || 'XAF',
      financialTransactionId: body.financialTransactionId,
    };

    if (!payload.transactionId) {
      return NextResponse.json(
        { error: 'Identifiant de transaction manquant dans le payload.' },
        { status: 400 }
      );
    }

    // Traitement idempotent
    const result = processMtnMomoWebhook(payload, idempotencyHeader || undefined);

    return NextResponse.json({
      status: 'ok',
      processed: true,
      alreadyProcessed: result.alreadyProcessed,
      message: result.message,
      transaction: result.transaction,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Erreur Webhook MTN MoMo:', err);
    return NextResponse.json(
      { error: 'Erreur interne lors du traitement du webhook.', details: err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'SENTINEL GESTION • Passerelle MTN Mobile Money Congo',
    status: 'online',
    currency: 'XAF (FCFA CEMAC)',
    country: 'République du Congo (+242)',
  });
}
