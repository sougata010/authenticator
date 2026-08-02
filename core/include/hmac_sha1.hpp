#pragma once
#include <vector>
#include <cstdint>

std::vector<uint8_t> sha1(const std::vector<uint8_t>& message);
std::vector<uint8_t> hmac_sha1(const std::vector<uint8_t>& key, const std::vector<uint8_t>& message);