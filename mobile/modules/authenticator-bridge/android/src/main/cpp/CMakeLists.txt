cmake_minimum_required(VERSION 3.22.1)
project(authenticator_jni)

add_library(authenticator_jni SHARED
    native-lib.cpp
    ../../../../../../../core/src/authenticator.cpp
    ../../../../../../../core/src/base32_reader.cpp
    ../../../../../../../core/src/hmac_sha1.cpp
    ../../../../../../../core/src/time_interval.cpp
)

target_include_directories(authenticator_jni PRIVATE
    ../../../../../../../core/include
)

find_library(log-lib log)
target_link_libraries(authenticator_jni ${log-lib})
