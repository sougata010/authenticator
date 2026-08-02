#include "../include/base32_reader.hpp"
using namespace std;

int base32_map[256];
bool is_initialized = false;

void init_base32_map()
{
    if (is_initialized)
        return;
    for (int i = 0; i < 256; i++)
    {
        base32_map[i] = -1;
    }
    for (char c = 'A'; c <= 'Z'; c++)
        base32_map[c] = c - 'A';
    for (char c = 'a'; c <= 'z'; c++)
        base32_map[c] = c - 'a';
    for (char c = '2'; c <= '7'; c++)
        base32_map[c] = c - '2' + 26;
    is_initialized = true;
}

vector<uint8_t> decode_base32_string(const string &secret)
{
    init_base32_map();
    vector<uint8_t> raw_bytes;
    int buffer = 0;
    int bits_in_buffer = 0;
    for (char c : secret)
    {
        if (c == '-' || c == ' ' || c == '=')
            continue;
        int base_val = base32_map[c];
        if (base_val == -1)
            continue;
        buffer = (buffer << 5) | base_val;
        bits_in_buffer += 5;
        if (bits_in_buffer >= 8)
        {
            uint8_t decoded = (buffer >> (bits_in_buffer - 8) & 0xFF);
            bits_in_buffer -= 8;
            raw_bytes.push_back(decoded);
            buffer = ((1 << bits_in_buffer) - 1) & buffer;
        }
    }
    return raw_bytes;
}
