<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PaymentController extends Controller
{
	public function index() {
		return view('index');
	}

	public function connectionToken(Request $request) {
		$stripe = new \Stripe\StripeClient($this->api_key());

		try {
		  $connectionToken = $stripe->terminal->connectionTokens->create();

		  return response()->json([
		  	'secret' => $connectionToken->secret
		  ]);
		} catch (Throwable $e) {
		  http_response_code(500);
		  return response()->json([
		  	'error' => $e->getMessage()
		  ]);
		}		
	}

	public function createPaymentIntent(Request $request) {
		$stripe = new \Stripe\StripeClient($this->api_key());

		try {
		  $intent = $stripe->paymentIntents->create([
		    'amount' => $request->amount,
		    'currency' => 'gbp',
		    'payment_method_types' => [
		      'card_present',
		    ],
		    'capture_method' => 'automatic'
		  ]);

		  return response()->json($intent);

		} catch (Throwable $e) {
		  http_response_code(500);
		  return response()->json(
		  	['error' => $e->getMessage()]
		  );
		}
	}

	private function api_key() {
		return env('STRIPE_API');
	}
}
