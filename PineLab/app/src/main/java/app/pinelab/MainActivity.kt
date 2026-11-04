package app.pinelab

import android.app.Activity
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.widget.Toast
import org.json.JSONArray

class MainActivity : Activity() {
    private lateinit var web: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        web.setBackgroundColor(android.graphics.Color.rgb(13, 18, 28))
        web.settings.javaScriptEnabled = true
        web.settings.domStorageEnabled = true
        web.settings.allowFileAccess = true
        web.settings.allowContentAccess = false
        web.settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        web.webChromeClient = WebChromeClient()
        web.addJavascriptInterface(PineLabBridge(), "PineLab")
        setContentView(web)
        web.loadUrl("file:///android_asset/index.html")
    }

    inner class PineLabBridge {
        @JavascriptInterface
        fun saveScript(name: String, source: String) {
            getSharedPreferences("pinelab_scripts", MODE_PRIVATE)
                .edit().putString(name, source).apply()
        }

        @JavascriptInterface
        fun loadScripts(): String {
            val prefs = getSharedPreferences("pinelab_scripts", MODE_PRIVATE)
            val array = JSONArray()
            prefs.all.toSortedMap().forEach { (name, value) ->
                val item = org.json.JSONObject()
                item.put("name", name)
                item.put("source", value?.toString() ?: "")
                array.put(item)
            }
            return array.toString()
        }

        @JavascriptInterface
        fun showMessage(message: String) {
            runOnUiThread { Toast.makeText(this@MainActivity, message, Toast.LENGTH_SHORT).show() }
        }
    }

    override fun onBackPressed() {
        if (::web.isInitialized && web.canGoBack()) web.goBack() else super.onBackPressed()
    }
}
