'use client';

import { useEffect } from 'react';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';
import { toast } from 'react-hot-toast';

interface PayPalPaymentProps {
    amount: number;
    currency?: string;
    onSuccess: (orderData: any) => Promise<void>;
    onError?: (error: any) => void;
}

export default function PayPalPayment({ amount, currency = "USD", onSuccess, onError }: PayPalPaymentProps) {
    const [{ options, isPending }, dispatch] = usePayPalScriptReducer();

    useEffect(() => {
        dispatch({
            type: "resetOptions",
            value: {
                ...options,
                currency: currency,
                clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""
            } as any, // Cast to avoid strict type error with react-paypal-js types
        });
    }, [currency, amount, options, dispatch]);

    return (
        <div className="w-full relative z-0">
            {isPending && <div className="text-center py-4 text-gray-400">جاري تحميل بوابة الدفع...</div>}
            <PayPalButtons
                style={{ layout: "vertical", shape: "rect", label: "pay" }}
                createOrder={(data, actions) => {
                    return actions.order.create({
                        intent: "CAPTURE", // Explicitly add intent to satisfy type
                        purchase_units: [
                            {
                                amount: {
                                    value: amount.toString(),
                                    currency_code: currency
                                },
                            },
                        ],
                    });
                }}
                onApprove={async (data, actions) => {
                    try {
                        const orderData = await actions.order?.capture();
                        console.log('PayPal Payment Captured:', orderData);
                        await onSuccess(orderData);
                    } catch (error) {
                        console.error("PayPal Capture Error:", error);
                        toast.error("حدث خطأ أثناء تأكيد الدفع");
                        if (onError) onError(error);
                    }
                }}
                onError={(err) => {
                    console.error("PayPal Button Error:", err);
                    toast.error("فشلت عملية الدفع. يرجى المحاولة مرة أخرى.");
                    if (onError) onError(err);
                }}
            />
        </div>
    );
}
