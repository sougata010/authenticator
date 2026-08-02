#include "../include/hmac_sha1.hpp"
using namespace std;

uint32_t left_rotate(uint32_t value, size_t count){
    return (value<<count) | (value>>(32-count)); //rotate with carry the first one for shift to right and second for leftout carry then or.
}

vector<uint8_t> sha1(const vector<uint8_t>& message){
    uint32_t h0 = 0x67452301;
    uint32_t h1 = 0xEFCDAB89;
    uint32_t h2 = 0x98BADCFE;
    uint32_t h3 = 0x10325476;
    uint32_t h4 = 0xC3D2E1F0;

    vector<uint8_t> padded_msg = message;
    uint64_t original_bit_len = message.size() * 8;
    padded_msg.push_back(0x80);

    while((padded_msg.size()+8)%64!=0){
        padded_msg.push_back(0x00);
    }
    for(int i=7;i>=0;i--){
        padded_msg.push_back((original_bit_len>>(i*8))&0xFF);
    }

    for(size_t chunk = 0;chunk<padded_msg.size();chunk+=64){
        uint32_t word[80];
        for(int i=0;i<16;i++){
            word[i] = ((uint32_t)padded_msg[chunk + i * 4]<< 24) | 
            ((uint32_t)padded_msg[chunk+i*4+1]<<16) | 
            ((uint32_t)padded_msg[chunk+i*4+2]<<8) | 
            ((uint32_t)padded_msg[chunk+i*4+3]) ;
        }
        for(int i=16;i<80;i++){
            word[i] = left_rotate(word[i-3]^word[i-8]^word[i-14]^word[i-16],1);
        }
        uint32_t a = h0;
        uint32_t b = h1;
        uint32_t c = h2;
        uint32_t d = h3;
        uint32_t e = h4;

        for (int i = 0; i < 80; ++i) {
            uint32_t f, K;
            if (i < 20) {
                f = (b & c) | (~b & d);
                K = 0x5A827999;
            } else if (i < 40) {
                f = b ^ c ^ d;
                K = 0x6ED9EBA1;
            } else if (i < 60) {
                f = (b & c) | (b & d) | (c & d);
                K = 0x8F1BBCDC;
            } else {
                f = b ^ c ^ d;
                K = 0xCA62C1D6;
            }
            uint32_t temp = left_rotate(a, 5) + f + e + K + word[i];
            e = d;
            d = c;
            c = left_rotate(b, 30);
            b = a;
            a = temp;
        }
        h0 += a;
        h1 += b;
        h2 += c;
        h3 += d;
        h4 += e;
    }
    vector<uint8_t> digest(20);
    uint32_t h[5]={h0,h1,h2,h3,h4};
    for (size_t i = 0; i < 5; i++)
    {
        digest[4*i]=(h[i]>>24)&0xFF;
        digest[4*i+1]=(h[i]>>16)&0xFF;
        digest[4*i+2]=(h[i]>>8)&0xFF;
        digest[4*i+3]=(h[i])&0xFF;
    }
    return digest;
}

vector<uint8_t> hmac_sha1(const vector<uint8_t>& key, const vector<uint8_t>& message) {
    vector<uint8_t> processed_key = key;
    if (processed_key.size() > 64) {
        processed_key = sha1(processed_key);
    }
    if (processed_key.size() < 64) {
        processed_key.resize(64, 0x00);
    }
    vector<uint8_t> inner_pad(64);
    vector<uint8_t> outer_pad(64);
    for (size_t i = 0; i < 64; ++i) {
        inner_pad[i] = processed_key[i] ^ 0x36;
        outer_pad[i] = processed_key[i] ^ 0x5C;
    }
    vector<uint8_t> inner_message = inner_pad;
    inner_message.insert(inner_message.end(), message.begin(), message.end());
    vector<uint8_t> inner_hash = sha1(inner_message);
    vector<uint8_t> outer_message = outer_pad;
    outer_message.insert(outer_message.end(), inner_hash.begin(), inner_hash.end());
    
    return sha1(outer_message); 
}