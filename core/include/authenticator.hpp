#pragma once
#include <vector>
#include <cstdint>

/**
 * @brief Generates a 6-digit Time-based One-Time Password (TOTP) from a raw secret key bytes.
 * @param secret_key The decoded Base32 secret key as a byte vector.
 * @return 6-digit TOTP integer code.
 */
uint32_t generate_totp(const std::vector<uint8_t>& secret_key);
