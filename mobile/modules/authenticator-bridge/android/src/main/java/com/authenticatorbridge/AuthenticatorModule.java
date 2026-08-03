package com.authenticatorbridge;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class AuthenticatorModule extends ReactContextBaseJavaModule {
    static {
        System.loadLibrary("authenticator_jni");
    }

    public AuthenticatorModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "AuthenticatorModule";
    }

    // Native method declaration matching native-lib.cpp
    public native String getTOTPCode(String secret);

    @ReactMethod
    public void getTOTP(String secret, Promise promise) {
        try {
            String code = getTOTPCode(secret);
            promise.resolve(code);
        } catch (Exception e) {
            promise.reject("ERR_TOTP", e.getMessage());
        }
    }
}
