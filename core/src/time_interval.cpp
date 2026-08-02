#include "../include/time_interval.hpp"
#include <iostream>
#include <ctime>

using namespace std;

vector<uint8_t> time_interval(){
    uint64_t curr_time_unix = time(nullptr);
    uint64_t interval = curr_time_unix/30;
    vector<uint8_t> time_array(8);
    for(int i=0;i<8;i++){
        time_array[i]= (interval>>(8*(8-i-1))) & 0xFF;
    }
    return time_array;
}