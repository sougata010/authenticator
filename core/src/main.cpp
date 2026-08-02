#include <iostream>
#include <iomanip>
#include <sstream>
#include <string>
#include <vector>
#include <cstdint>
#include <ctime>
#include "../include/base32_reader.hpp"
#include "../include/time_interval.hpp"
#include "../include/hmac_sha1.hpp"
#include "../include/authenticator.hpp"

using namespace std;

void print_hex(const string& label, const vector<uint8_t>& data) {
    cout << label << ": ";
    for (uint8_t byte : data) {
        cout << hex << uppercase << setw(2) << setfill('0') << (int)byte << " ";
    }
    cout << dec << "\n"; 
}

std::string format_otp(uint32_t otp) {
    std::ostringstream oss;
    oss << std::setw(6) << std::setfill('0') << otp;
    return oss.str();
}


int main() {
    string secret = "JBSWY3DPEHPK3PXP";
    vector<uint8_t> decoded_secret = decode_base32_string(secret);
    vector<uint8_t> time_bytes = time_interval();
    cout << "--- TOTP ENGINE TEST ---\n";
    print_hex("Decoded Secret", decoded_secret);
    print_hex("Time Array    ", time_bytes);
    uint32_t raw_code = generate_totp(decoded_secret);
    string final_code = format_otp(raw_code);
    cout << "------------------------\n";
    cout << "Your Live TOTP Code: " << final_code << "\n";
    cout << "------------------------\n";
    
    return 0;
}