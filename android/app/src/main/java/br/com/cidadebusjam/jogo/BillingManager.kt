package br.com.cidadebusjam.jogo

import android.app.Activity
import com.android.billingclient.api.AcknowledgePurchaseParams
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.ConsumeParams
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import org.json.JSONArray
import org.json.JSONObject

/** Compras no Google Play. Cadastre todos como "produto único" no Play Console.
 *  ONCE: compra para sempre (confirmada com acknowledge). CONSUMABLE: pode comprar de novo (consumida). */
class BillingManager(private val act: Activity, private val emit: (JSONObject) -> Unit) : PurchasesUpdatedListener {
    companion object {
        val ONCE = listOf("remove_ads", "welcome_pack")
        val CONSUMABLE = listOf("pass_month", "coins_small", "coins_big")
        val IDS = ONCE + CONSUMABLE
    }

    private val client: BillingClient = BillingClient.newBuilder(act)
        .setListener(this)
        .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
        .build()
    private var details: Map<String, ProductDetails> = emptyMap()

    fun start() {
        if (client.isReady) { loadAll(); return }
        client.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(r: BillingResult) { if (r.responseCode == BillingClient.BillingResponseCode.OK) loadAll() }
            override fun onBillingServiceDisconnected() { }
        })
    }

    /** Ao voltar para o app: confere de novo (ex.: compra pendente concluída fora do jogo). */
    fun refresh() { if (client.isReady) queryOwned() }
    fun close() { client.endConnection() }

    private fun loadAll() { queryDetails(); queryOwned() }

    private fun queryDetails() {
        val products = IDS.map {
            QueryProductDetailsParams.Product.newBuilder().setProductId(it).setProductType(BillingClient.ProductType.INAPP).build()
        }
        client.queryProductDetailsAsync(QueryProductDetailsParams.newBuilder().setProductList(products).build()) { _, result ->
            details = result.productDetailsList.associateBy { it.productId }
            val prices = JSONObject()
            details.forEach { (id, d) -> d.oneTimePurchaseOfferDetails?.let { prices.put(id, it.formattedPrice) } }
            emit(JSONObject().put("type", "prices").put("prices", prices))
        }
    }

    private fun queryOwned() {
        client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build()) { r, list ->
            if (r.responseCode == BillingClient.BillingResponseCode.OK) {
                emit(JSONObject().put("type", "owned").put("ids", JSONArray(handle(list))))
            }
        }
    }

    /** Confirma as compras concluídas (sem isso o Google estorna em 3 dias).
     *  Consumíveis só são entregues ao jogo depois de consumidos, uma vez por recibo. Devolve os ids "para sempre". */
    private fun handle(purchases: List<Purchase>): List<String> {
        val owned = mutableListOf<String>()
        for (p in purchases) {
            if (p.purchaseState != Purchase.PurchaseState.PURCHASED) continue
            val id = p.products.firstOrNull { it in IDS } ?: continue
            if (id in CONSUMABLE) {
                client.consumeAsync(ConsumeParams.newBuilder().setPurchaseToken(p.purchaseToken).build()) { r, token ->
                    if (r.responseCode == BillingClient.BillingResponseCode.OK) {
                        emit(JSONObject().put("type", "purchased").put("id", id).put("token", token))
                    }
                }
                continue
            }
            if (!p.isAcknowledged) {
                client.acknowledgePurchase(AcknowledgePurchaseParams.newBuilder().setPurchaseToken(p.purchaseToken).build()) { }
            }
            owned += id
        }
        return owned
    }

    fun buy(id: String) {
        val d = details[id] ?: run { emit(JSONObject().put("type", "error")); start(); return }
        val params = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(listOf(BillingFlowParams.ProductDetailsParams.newBuilder().setProductDetails(d).build()))
            .build()
        client.launchBillingFlow(act, params)
    }

    override fun onPurchasesUpdated(r: BillingResult, purchases: MutableList<Purchase>?) {
        if (r.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            handle(purchases).forEach { emit(JSONObject().put("type", "purchased").put("id", it).put("token", "once-$it")) }
        } else if (r.responseCode != BillingClient.BillingResponseCode.USER_CANCELED) {
            emit(JSONObject().put("type", "error"))
        }
    }
}
