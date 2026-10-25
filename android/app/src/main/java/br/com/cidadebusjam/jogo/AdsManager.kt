package br.com.cidadebusjam.jogo

import android.app.Activity
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.google.android.ump.ConsentInformation
import com.google.android.ump.ConsentRequestParameters
import com.google.android.ump.UserMessagingPlatform
import org.json.JSONObject
import java.util.concurrent.atomic.AtomicBoolean

/** Anúncios do AdMob: intersticial entre fases e premiado (dica, reviver, bônus).
 *  Antes de tudo pede o consentimento (UMP), exigido para quem joga na Europa e no Reino Unido. */
class AdsManager(private val act: Activity, private val emit: (JSONObject) -> Unit) {
    private var inter: InterstitialAd? = null
    private var rewarded: RewardedAd? = null
    private val started = AtomicBoolean(false)
    private val consent: ConsentInformation = UserMessagingPlatform.getConsentInformation(act)

    fun init() {
        consent.requestConsentInfoUpdate(act, ConsentRequestParameters.Builder().build(), {
            UserMessagingPlatform.loadAndShowConsentFormIfRequired(act) { startAds() }
        }, { startAds() })
        if (consent.canRequestAds()) startAds()          // consentimento de uma sessão anterior
    }

    private fun startAds() {
        if (!consent.canRequestAds() || started.getAndSet(true)) return
        MobileAds.initialize(act) { }
        loadInterstitial()
        loadRewarded()
    }

    /** Reabre o formulário de privacidade (botão nas Configurações do jogo). */
    fun privacyOptions() {
        UserMessagingPlatform.showPrivacyOptionsForm(act) { startAds() }
    }

    private fun loadInterstitial() {
        InterstitialAd.load(act, BuildConfig.INTERSTITIAL_ID, AdRequest.Builder().build(), object : InterstitialAdLoadCallback() {
            override fun onAdLoaded(ad: InterstitialAd) { inter = ad }
            override fun onAdFailedToLoad(e: LoadAdError) { inter = null }
        })
    }

    private fun loadRewarded() {
        RewardedAd.load(act, BuildConfig.REWARDED_ID, AdRequest.Builder().build(), object : RewardedAdLoadCallback() {
            override fun onAdLoaded(ad: RewardedAd) { rewarded = ad }
            override fun onAdFailedToLoad(e: LoadAdError) { rewarded = null }
        })
    }

    fun showInterstitial() {
        val ad = inter ?: run { if (started.get()) loadInterstitial(); return }   // sem anúncio pronto: não mostra
        inter = null
        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() { loadInterstitial() }
            override fun onAdFailedToShowFullScreenContent(e: AdError) { loadInterstitial() }
        }
        ad.show(act)
    }

    fun showRewarded() {
        val ad = rewarded ?: run {
            if (started.get()) loadRewarded()
            emit(JSONObject().put("type", "reward").put("ok", false))
            return
        }
        rewarded = null
        var earned = false
        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                emit(JSONObject().put("type", "reward").put("ok", earned))
                loadRewarded()
            }
            override fun onAdFailedToShowFullScreenContent(e: AdError) {
                emit(JSONObject().put("type", "reward").put("ok", false))
                loadRewarded()
            }
        }
        ad.show(act) { earned = true }
    }
}
