
var xas2 = require('xas2');
var jsgui = require('jsgui3');
var each = jsgui.each;
var tof = jsgui.tof;
var Binary_Encoding = require('./binary-encoding');

// 01/08/2017 - Looks like this will need to get a bit more complicated, with storing the data types, and sometimes the lengths, within the encoding itself.

// These binary encoding types differ to the Native Types in the DB.

// First Byte of encoded item
// ----------

// 0  - xas2 number
// 1  - 64 bit BE float
// 2  - unix time in ms           t
// 3  - unix time range in ms     [t, t]
// 4  - string                    [xas2(l), str]
// 5  - indexed xas2 number, representing a string
// 6  - bool, false 1 byte
// 7  - bool, true 1 byte
// 8  - null. No further data
// 9  - buffer of binary data
// 10 - array                     l, sequence of encoded items


const XAS2 = 0;
const DOUBLEBE = 1;
const DATE = 2;
const STRING = 4;
const BOOL_FALSE = 6;
const BOOL_TRUE = 7;
const NULL = 8;
const BUFFER = 9;
const ARRAY = 10;





if (require.main === module) {
    var test_array_encoding = () => {
        var input = [1, 2, 3, 4, [5, 6]];
        var buf_encoded = Binary_Encoding.encode_to_buffer(input);

        console.log('input', input);
        console.log('buf_encoded', buf_encoded);

        var decoded = Binary_Encoding.decode_buffer(buf_encoded);

        console.log('decoded', decoded);

    }
    test_array_encoding();






} else {
    //console.log('required as a module');
}