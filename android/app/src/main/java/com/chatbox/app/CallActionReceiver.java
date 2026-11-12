package com.chatbox.app;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class CallActionReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if ("com.chatbox.app.DECLINE_CALL".equals(intent.getAction())) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(ChatboxMessagingService.CALL_NOTIFICATION_ID);
            }

            final String callId = intent.getStringExtra("callId");
            if (callId != null && !callId.isEmpty()) {
                new Thread(() -> {
                    try {
                        URL url = new URL("https://abirdroid.ddns.net/chatbox/api/push/call-decline");
                        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                        conn.setRequestMethod("POST");
                        conn.setRequestProperty("Content-Type", "application/json");
                        conn.setConnectTimeout(4000);
                        conn.setReadTimeout(4000);
                        conn.setDoOutput(true);
                        String body = "{\"callId\":\"" + callId + "\"}";
                        try (OutputStream os = conn.getOutputStream()) {
                            os.write(body.getBytes("UTF-8"));
                        }
                        conn.getResponseCode();
                        conn.disconnect();
                    } catch (Exception ignored) {}
                }).start();
            }
        }
    }
}
