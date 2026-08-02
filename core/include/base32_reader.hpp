#pragma once
#include <vector>
#include <string>
#include <cstdint>

// Notice the std:: is strictly required here!
std::vector<uint8_t> decode_base32_string(const std::string& secret);