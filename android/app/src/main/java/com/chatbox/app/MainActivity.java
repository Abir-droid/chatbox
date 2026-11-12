package com.chatbox.app;

import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        handleCallIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleCallIntent(intent);
    }

    private void handleCallIntent(Intent intent) {
        if (intent == null) return;
        String action = intent.getStringExtra("action");
        if ("answer_call".equals(action)) {
            String callId = intent.getStringExtra("callId");
            String convId = intent.getStringExtra("conversationId");

            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(ChatboxMessagingService.CALL_NOTIFICATION_ID);
            }

            if (getBridge() != null && getBridge().getWebView() != null) {
                final String safeCallId = callId != null ? callId : "";
                final String safeConvId = convId != null ? convId : "";
                final String js = "window._autoAnswerCallId = '" + safeCallId + "';" +
                    "window.dispatchEvent(new CustomEvent('native_call_action', { detail: { action: 'answer', callId: '" + safeCallId + "', conversationId: '" + safeConvId + "' } }));";
                getBridge().getWebView().postDelayed(() -> getBridge().getWebView().evaluateJavascript(js, null), 400);
                getBridge().getWebView().postDelayed(() -> getBridge().getWebView().evaluateJavascript(js, null), 1200);
                getBridge().getWebView().postDelayed(() -> getBridge().getWebView().evaluateJavascript(js, null), 2400);
            }
        }
    }
}
