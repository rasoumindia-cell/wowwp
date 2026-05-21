package tech.wacrm.mobile;

import android.os.Bundle;
import android.os.Handler;
import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.WebView;
import android.webkit.ValueCallback;
import android.widget.ImageView;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;
import java.util.concurrent.atomic.AtomicBoolean;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        AtomicBoolean keepSplash = new AtomicBoolean(true);
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setKeepOnScreenCondition(keepSplash::get);
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            getWindow().setStatusBarColor(Color.parseColor("#FF5722"));
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            getWindow().setStatusBarContrastEnforced(false);
        }

        View content = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(content, (view, insets) -> {
            int top = insets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
            if (top > 0) {
                view.setPadding(0, top, 0, 0);
            }
            return insets;
        });
        ViewCompat.requestApplyInsets(content);

        ImageView splashView = new ImageView(this);
        splashView.setImageResource(R.drawable.splash);
        splashView.setScaleType(ImageView.ScaleType.CENTER_CROP);
        splashView.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));
        ((ViewGroup) content).addView(splashView);

        new Handler(getMainLooper()).postDelayed(() -> {
            keepSplash.set(false);
            splashView.animate()
                    .alpha(0f)
                    .setDuration(300)
                    .withEndAction(() -> ((ViewGroup) content).removeView(splashView));
        }, 2000);
    }

    private void goBackWithAnimation(WebView webView) {
        webView.evaluateJavascript(
            "(function(){" +
            "var next=document.getElementById('__next');" +
            "if(!next){window.history.back();return;}" +
            "var old=document.getElementById('__backOverlay');" +
            "if(old)old.remove();" +
            "var clone=next.cloneNode(true);" +
            "clone.id='__backOverlay';" +
            "clone.querySelectorAll('*').forEach(function(e){" +
            "if(getComputedStyle(e).position==='fixed')e.style.display='none';" +
            "});" +
            "var bg=getComputedStyle(document.body).backgroundColor;" +
            "if(!bg||bg==='rgba(0,0,0,0)'||bg==='transparent')bg='#09090b';" +
            "clone.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;overflow-y:auto;background:'+bg+';';" +
            "document.documentElement.appendChild(clone);" +
            "window.history.back();" +
            "setTimeout(function(){" +
            "clone.style.transition='transform 250ms cubic-bezier(0.4,0,0.2,1)';" +
            "clone.style.transform='translateX(100%)';" +
            "setTimeout(function(){clone.remove();},250);" +
            "},300);" +
            "})()",
            null
        );
    }

    @Override
    public void onBackPressed() {
        WebView webView = bridge.getWebView();
        if (webView == null) {
            finish();
            overridePendingTransition(0, R.anim.slide_out_right);
            return;
        }

        webView.evaluateJavascript(
            "window.history.length > 1",
            new ValueCallback<String>() {
                @Override
                public void onReceiveValue(String value) {
                    if ("true".equals(value)) {
                        goBackWithAnimation(webView);
                    } else {
                        finish();
                        overridePendingTransition(0, R.anim.slide_out_right);
                    }
                }
            }
        );
    }
}
