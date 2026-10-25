package br.com.cidadebusjam.jogo

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import org.json.JSONArray

/** Lembretes locais (baú pronto, cofre cheio, desafio do dia). Sem servidor: o jogo agenda ao ir para o fundo. */
object Reminders {
    private const val CHANNEL = "lembretes"
    private const val MAX_ID = 8

    private fun pending(ctx: Context, id: Int, title: String = "", body: String = ""): PendingIntent {
        val i = Intent(ctx, ReminderReceiver::class.java).putExtra("id", id).putExtra("t", title).putExtra("b", body)
        return PendingIntent.getBroadcast(ctx, id, i, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    }

    fun replace(ctx: Context, list: JSONArray) {
        val am = ctx.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        for (id in 1..MAX_ID) am.cancel(pending(ctx, id))
        val now = System.currentTimeMillis()
        for (k in 0 until minOf(list.length(), MAX_ID)) {
            val o = list.getJSONObject(k)
            val id = o.optInt("id")
            val at = o.optLong("at")
            if (id !in 1..MAX_ID || at <= now) continue
            // alarme inexato: economiza bateria e não exige permissão especial
            am.set(AlarmManager.RTC, at, pending(ctx, id, o.optString("t").take(60), o.optString("b").take(160)))
        }
    }

    fun show(ctx: Context, id: Int, title: String, body: String) {
        val nm = ctx.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CHANNEL) == null) {
            nm.createNotificationChannel(NotificationChannel(CHANNEL, ctx.getString(R.string.channel_name), NotificationManager.IMPORTANCE_DEFAULT))
        }
        val open = PendingIntent.getActivity(ctx, 0, Intent(ctx, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val n = NotificationCompat.Builder(ctx, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_bus)
            .setContentTitle(title)
            .setContentText(body)
            .setContentIntent(open)
            .setAutoCancel(true)
            .build()
        try { NotificationManagerCompat.from(ctx).notify(id, n) } catch (_: SecurityException) { }   // sem permissão: ignora
    }
}

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(ctx: Context, intent: Intent) {
        val t = intent.getStringExtra("t") ?: return
        Reminders.show(ctx, intent.getIntExtra("id", 1), t, intent.getStringExtra("b") ?: "")
    }
}
