package com.chatbox.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import java.util.Map;

public class ChatboxMessagingService extends FirebaseMessagingService {

    public static final String CHANNEL_CALLS = "incoming_calls_v2";
    public static final int CALL_NOTIFICATION_ID = 9999;

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        Map<String, String> data = remoteMessage.getData();
        if (data != null) {
            String type = data.get("type");
            if ("incoming_call".equals(type)) {
                showIncomingCallNotification(data);
                return;
            } else if ("call_dismiss".equals(type) || "call_ended".equals(type)) {
                dismissCallNotification();
                return;
            }
        }

        // Delegate standard chat notifications to Capacitor's plugin
        try {
            PushNotificationsPlugin.sendRemoteMessage(remoteMessage);
        } catch (Exception ignored) {}
    }

    private void showIncomingCallNotification(Map<String, String> data) {
        String callerName = data.get("callerName");
        if (callerName == null || callerName.isEmpty()) callerName = "Someone";
        String callType = data.get("callType");
        String callTitle = "video".equalsIgnoreCase(callType) ? "Incoming Video Call" : "Incoming Voice Call";
        String callId = data.get("callId");
        String convId = data.get("conversationId");

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        createCallChannel(notificationManager);

        // Tap notification or press "Answer"
        Intent answerIntent = new Intent(this, MainActivity.class);
        answerIntent.setAction("ANSWER_CALL");
        answerIntent.putExtra("action", "answer_call");
        answerIntent.putExtra("callId", callId != null ? callId : "");
        answerIntent.putExtra("conversationId", convId != null ? convId : "");
        answerIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        PendingIntent answerPendingIntent = PendingIntent.getActivity(
            this,
            101,
            answerIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Tap "Decline"
        Intent declineIntent = new Intent(this, CallActionReceiver.class);
        declineIntent.setAction("com.chatbox.app.DECLINE_CALL");
        declineIntent.putExtra("callId", callId != null ? callId : "");

        PendingIntent declinePendingIntent = PendingIntent.getBroadcast(
            this,
            102,
            declineIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_CALLS)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(callTitle)
            .setContentText(callerName + " is calling…")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setAutoCancel(true)
            .setOngoing(true)
            .setSound(ringtoneUri)
            .setVibrate(new long[] { 0, 1000, 800, 1000, 800, 1000 })
            .setContentIntent(answerPendingIntent)
            .setFullScreenIntent(answerPendingIntent, true)
            .addAction(android.R.drawable.ic_menu_call, "Answer", answerPendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Decline", declinePendingIntent);

        if (notificationManager != null) {
            notificationManager.notify(CALL_NOTIFICATION_ID, builder.build());
        }
    }

    private void dismissCallNotification() {
        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.cancel(CALL_NOTIFICATION_ID);
        }
    }

    private void createCallChannel(NotificationManager manager) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && manager != null) {
            NotificationChannel channel = manager.getNotificationChannel(CHANNEL_CALLS);
            if (channel == null) {
                Uri ringtoneUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                    .build();

                channel = new NotificationChannel(CHANNEL_CALLS, "Incoming Calls", NotificationManager.IMPORTANCE_HIGH);
                channel.setDescription("Full-screen ringing notifications for incoming calls");
                channel.setSound(ringtoneUri, audioAttributes);
                channel.enableVibration(true);
                channel.setVibrationPattern(new long[] { 0, 1000, 800, 1000, 800, 1000 });
                channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        try {
            PushNotificationsPlugin.onNewToken(token);
        } catch (Exception ignored) {}
    }
}
