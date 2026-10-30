import { NextRequest, NextResponse } from 'next/server';
import { 
  processMtnMomoWebhook, 
  verifyMtnWebhookSignature, 
  isPaymentEventProcessedInDatabase,
  MtnWebhookPayload 
} from '@/lib/payments/mtnMomo';

/**
 * Route Webhook pour MTN Mobile Money Congo-Brazzaville
 * Endpoint: POST /api/webhooks/mtn-momo
 * Traitement strictement idempotent et authentifié des accusés de paiement
 */
export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-momo-signature') || req.headers.get('x-signature') || req.headers.get('authorization');
    const idempotencyHeader = req.headers.get('x-idempotency-key') || req.headers.get('x-reference-id');
    const webhookSecret = process.env.MTN_MOMO_WEBHOOK_SECRET;

    // Lecture du corps brut pour vérification de la signature
    const rawBody = await req.text();

    // En production ou dès qu'un secret est configuré, la signature HMAC est obligatoire
    if (process.env.NODE_ENV === 'production' || webhookSecret) {
      if (!webhookSecret) {
        console.error('Erreur sécurité : MTN_MOMO_WEBHOOK_SECRET non configuré en production.');
        return NextResponse.json(
          { error: 'Configuration serveur incomplète pour les paiements sécurisés.' },
          { status: 500 }
        );
      }

      const isValidSignature = await verifyMtnWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValidSignature) {
        return NextResponse.json(
          { error: 'Signature de webhook invalide ou manquante.' },
          { status: 401 }
        );
      }
    }

    // Analyse du payload JSON
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: 'Format JSON invalide.' },
        { status: 400 }
      );
    }

    const payload: MtnWebhookPayload = {
      transactionId: (body.transactionId || body.externalId || body.id) as string,
      reference: (body.reference || body.clientReference || `MTN-CG-${Date.now()}`) as string,
      status: (body.status as 'SUCCESSFUL' | 'FAILED' | 'PENDING') || 'SUCCESSFUL',
      amount: Number(body.amount) || 0,
      currency: (body.currency as string) || 'XAF',
      financialTransactionId: body.financialTransactionId as string | undefined,
    };

    if (!payload.transactionId) {
      return NextResponse.json(
        { error: 'Identifiant de transaction manquant dans le payload.' },
        { status: 400 }
      );
    }

    // 0. Vérification d'idempotence préalable en base Postgres
    const key = idempotencyHeader || payload.reference || payload.transactionId;
    const isAlreadyInDb = await isPaymentEventProcessedInDatabase(key);
    if (isAlreadyInDb) {
      return NextResponse.json({
        status: 'ok',
        processed: true,
        alreadyProcessed: true,
        message: `Transaction ${key} déjà confirmée dans le registre persistant.`,
        timestamp: new Date().toISOString(),
      });
    }

    // Traitement avec validation stricte du registre de transactions
    const result = processMtnMomoWebhook(
      payload, 
      idempotencyHeader || undefined, 
      { strictRegistry: process.env.NODE_ENV === 'production' }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 422 }
      );
    }

    return NextResponse.json({
      status: 'ok',
      processed: true,
      alreadyProcessed: result.alreadyProcessed,
      message: result.message,
      transaction: result.transaction,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    // Ne jamais divulguer de stack trace ou d'erreur interne détaillée dans la réponse API
    console.error('Erreur Webhook MTN MoMo:', err);
    return NextResponse.json(
      { error: 'Erreur interne lors du traitement du webhook.' },
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
