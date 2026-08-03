#import <React/RCTBridgeModule.h>
#import <Foundation/Foundation.h>
#include "authenticator.hpp"
#include "base32_reader.hpp"

@interface AuthenticatorModule : NSObject <RCTBridgeModule>
@end

@implementation AuthenticatorModule

RCT_EXPORT_MODULE();

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0);
}

RCT_EXPORT_METHOD(getTOTP:(NSString *)secret
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  @try {
    std::string cpp_secret = [secret UTF8String];
    std::vector<uint8_t> decoded_secret = decode_base32_string(cpp_secret);
    uint32_t raw_code = generate_totp(decoded_secret);
    
    NSString *code_ns = [NSString stringWithFormat:@"%06u", raw_code];
    resolve(code_ns);
  } @catch (NSException *exception) {
    reject(@"ERR_TOTP", exception.reason, nil);
  } @catch (...) {
    reject(@"ERR_TOTP", @"Unknown C++ exception occurred", nil);
  }
}

@end
