#include <jni.h>
#include <string>
#include <vector>
#include <cstdio>
#include "authenticator.hpp"
#include "base32_reader.hpp"

extern "C" JNIEXPORT jstring JNICALL
Java_com_authenticatorbridge_AuthenticatorModule_getTOTPCode(
        JNIEnv* env,
        jobject /* this */,
        jstring secret_jstr) {
    
    const char* native_secret = env->GetStringUTFChars(secret_jstr, nullptr);
    std::string secret(native_secret);
    env->ReleaseStringUTFChars(secret_jstr, native_secret);

    try {
        std::vector<uint8_t> decoded_secret = decode_base32_string(secret);
        uint32_t raw_code = generate_totp(decoded_secret);
        
        // Format to exactly 6 digits with leading zeros
        char code_str[7];
        snprintf(code_str, sizeof(code_str), "%06u", raw_code);
        return env->NewStringUTF(code_str);
    } catch (...) {
        return env->NewStringUTF("000000");
    }
}
