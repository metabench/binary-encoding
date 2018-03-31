/**
 * Created by James on 18/10/2016.
 
Will change key prefix behaviour.
Want it so that when key prefixes are used, the system notes how many get encoded into the array.

More facilities within Binary_Encoding to specify use of key prefixes, while making them available on read without needing to say they are there in advance.
Better for recursive reads, with layers of encoding.

// When encoding with xas2 prefixes, specify that in the encoding itself.
// Do more to specify that each record is a record.
//  Not sure about changing the way the server provides them.
//  Need to change the way that records are saved in backups.

07/03/2018 - This could do with a much simpler API
generally: encode, decode

Not so sure we need the object to do this either.

 
 */








// The binary encoding system is greatly changing...
//  It's going to put a byte in front of every value to show what data type it is.
//   Except in at least one optional special case.


// Need to encode and unencode JavaScript objects, and data.
// It would be fine to deal with arrays of unencoded fields.

var xas2 = require('xas2');

// Currently deals with xas2 to encode integers.
//  Want to also encode strings in the beginning and mid points of a record/key/value. Should say the length of the string, should identify it's a string?

var lang = require('lang-mini');
var each = lang.each;
var tof = lang.tof;
var is_defined = lang.is_defined;
let deep_equal = lang.deep_equal;

var zlib = require('zlib');


var zlib_compress_buffer = (buf, level = 9) => {
    var res = zlib.deflateRawSync(buf, {
        level: level
    });
    return res;
}

var zlib_uncompress_buffer = (buf, level = 9) => {
    var res = zlib.inflateRawSync(buf, {
        level: level
    });
    return res;
}

//zlib_compress_buffer = require('compress-buffer').compress;
//zlib_uncompress_buffer = require('compress-buffer').uncompress;

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

// Satoshi 32 bit number
//  Positive integer number of satoshis. Ie good at representing fractions up to 10 decimal places (or is it 9?)



// 2^2 (4) items
// x    false, false
// x+1  false, true
// x+2  true, false
// x+3  true, true

// 2^4 (16) items - Seems like a useful use of encoding space. Could get 8 bool flags within 2 bytes.
// x    false, false, false, false
//  ...
// x+15 true, true, true, true


const XAS2 = 0;
const DOUBLEBE = 1;
const DATE = 2;

const STRING = 4;
const BOOL_FALSE = 6;
const BOOL_TRUE = 7;

const NULL = 8;
const BUFFER = 9;

// Specifically want to encode array as well.

const ARRAY = 10;
const COMPRESSED_BUFFER = 11;

// Not sure about this. Using float64s looks best for now.
const SATOSHI_32 = 20;





const COMPRESSION_ZLIB_9 = 0;


// COMPRESSSED_BUFFER, COMPRESSION_ZLIB_9, 






// Reencoding existing field values within the database will be possible.
//  Can convert number fields to satoshi 32 within the records.
//   Would most likely save space.

// Want binary encoding to also do compression.
//  Would be an option.
//  Could have a Binary_Encoder object possibly.
//   

// A bit more client-side for backups and downloading from remote server.
// A lot more on the server-side to greatly advance it in a short space of time.
//  Handling compression
//  Indexing rows
//   Index lookups will be ok on ll then
//   Index lookup queries that reference fields by name
//  Higher level capabilities to handle data, including encoding it.
//  Streaming of data. Sending the data in pages
//   Viewing table, or table query using HTML.
//    Could return record sets as HTML, rendered on the server.

// Sharing data, server-server, server-client
//  Downloading (large?) sets of data, subscribing to updates.
//  Loading large data sets from backups, augmenting that data.
//  Maintaining a local NextLevelDB for querying?

// Next task is to do more to ensure the continuity of data gathering and backups.
// Then to make use of the data available.

// Later will enable compressed data download from the server.








// A function to compress using Binary_Encoding
//  Decompression will be automatic, as it reads there is a compressed item, and decompresses it.

// Leave compression for the moment, and work on getting backup data sent back to a server.
//  ??? Compression could speed it up a fair bit? Would shrink some files and make them faster to send - but slower to start sending.
//   


// Want to get another server running, with the capability of loading from another server using the backup-like system.
//  Would also be worth storing the program version of whatever generated the server model.
//  General DB properties.

// Ability to get graphs from the DB itself will be cool.

// For the moment, really want the live updating data structure.
//  Keep the main server going for the moment.

// Want to get it into a fast, querying object.

var compress_buffer_zlib9 = (buf) => {
    var c_buf = zlib_compress_buffer(buf, 9);
    var l = c_buf.length;
    var res = Buffer.concat([xas2(COMPRESSED_BUFFER).buffer, xas2(COMPRESSION_ZLIB_9).buffer, xas2(l).buffer, c_buf]);
    return res;
}


// Binary_Record_Encoding
//  Has both key and value


// encode_item_to_type

var encode_item = function (encoding_type, item) {
    //console.log('');
    //console.log('encode_item encoding_type', encoding_type);
    //console.log('item', item);

    //console.trace();

    var field_name; // may ignore this
    var str_type; // the important thing
    var i_type;

    var res;

    // dt32

    if (encoding_type.length === 1) {
        //field_name = encoding_type[0];
        //str_type = encoding_type[1];

        if (encoding_type[0] === 'dt32') {
            field_name = 'datetime';
            str_type = 'dt32';
            i_type = 2;
            //str_type = 'xas2';
        }
        if (encoding_type[0] === 'id') {
            field_name = 'id';
            str_type = 'xas2';
            i_type = 0;
        }
        if (encoding_type[0] === 'name') {
            field_name = 'name';
            str_type = 'string';
            i_type = 4;
        }
    }

    if (encoding_type.length === 2) {
        field_name = encoding_type[0];
        // Check to see if it's a string?
        str_type = encoding_type[1];
    }


    var further_encoding_params;
    if (encoding_type.length === 3) {
        field_name = encoding_type[0];
        str_type = encoding_type[1];
        further_encoding_params = encoding_type.slice(2);
        //console.log('further_encoding_params', further_encoding_params);
    }
    //console.log('field_name', field_name);
    //console.log('str_type', str_type);
    if (str_type === 'xas2') {
        i_type = 0;
        res = xas2(item).buffer;
    } else if (str_type === 'dt32') {
        // It's a 64 bit integer.
        //  Think the milliseconds from JavaScript is 64 bit (or more than 32 at least).
        //  Maybe xas2 instead for this?
        i_type = 2;

        res = Buffer.alloc(6);
        res.writeUIntBE(item, 0, 6);
        //res = xas2(item).buffer;
    } else {
        //console.log('encoding_type', encoding_type);
        //console.log('str_type', str_type);
        if (str_type === 'indexed') {
            // indexed integer
            i_type = 5;


            var arr_index = further_encoding_params[0];
            // then the arr of indexed values are in the next part.
            //  Could slow it down creating a map to see which item it is, or searching for them.
            var found = false,
                i = 0,
                l = arr_index.length;
            while (!found && i < l) {
                //console.log('arr_index[i]', arr_index[i]);
                found = arr_index[i++] === item;
            }
            if (found) {
                res = xas2(i - 1).buffer;
            } else {
                throw 'item not found in index'
            }

        } else if (str_type === 'string') {
            // If its the last string then just write the string.
            //  Otherwise will need to indicate the length of the string with an xas2, then write the string.

            // xstring type?
            //  or convert the non-last ones to xstring type automatically?
            //  Or another parameter called encode_string_length, with default value of false?

            // Don't need to encode that it is a string. That is known from the schema, and keeping track of position with sequential reads.
            //  Need to encode its length to start with though.

            // Start with the string's length as the first field.
            //  Use xas2 for this.

            // Breaking change... bump major version?

            i_type = 4;

            var buf_str_res = Buffer.from(item);
            var buf_str_len = xas2(buf_str_res.length);

            res = Buffer.concat(buf_str_len, buf_str_res);


        } else if (str_type === 'f64be') {
            i_type = 1;
            res = Buffer.alloc(8);
            res.writeDoubleBE(item, 0);
        } else if (str_type === 'bool') {
            i_type = 6;
            res = Buffer.alloc(1);
            if (item === true || item === 1) {
                res.writeInt8(1, 0);
            } else {
                res.writeInt8(0, 0);
            }
            //res.writeDoubleBE(item, 0);
        }
        //throw 'stop';
    }

    // var res2 = xas2(i_type
    var buf_i = Buffer.alloc(1);
    buf_i.writeInt8(i_type, 0);
    var res2 = Buffer.concat([buf_i, res]);

    //if (str_type)
    //return res;
    return res2;
};


// The encoding system gets defined in the constructor.

class Binary_Encoding {
    // Should not necessarily need an encoding object.
    //  In many cases, just give it the values, and it will get on with encoding them into buffers.

    'constructor' (spec) {


        var arr_encodings = [];
        if (Array.isArray(spec)) {
            arr_encodings = spec;
        }
        if (arr_encodings) this.arr_encodings = arr_encodings;
    }
    'encode' (unencoded) {
        return Binary_Encoding.encode_to_buffer(unencoded);
    }
    'decode' (buffer, ignore_prefix) {
        var arr_encodings = this.arr_encodings;
        var read_pos = 0;

        var field_name, str_type, pos, val, arr_additional_encoding_params, read_val, prefix;
        var res = [];
        pos = 0;

        if (ignore_prefix) {
            [prefix, pos] = xas2.read(buffer, 0);
        }

        return res;
    }
}


// This may be changed / merged into NextlevelDB-Record

// A record object would be useful for serving as a bridge between different data formats.
//  Data conversion is done within the record, code clutter in other places.
//  Some standardised index lookups are available from Record.


// These would probably be better removed, or moved to the db section.

class Binary_Record_Encoding {
    'constructor' (spec) {
        this.encoding = spec;
        this.key_encoding = new Binary_Encoding(spec.key);
        this.value_encoding = new Binary_Encoding(spec.value);
    }

    'encode_query' (query) {
        return this.key_encoding.encode_query(query);
    }

    // And a tables key prefix
    //  Something to indicate we are in the tables section of the database

    'encode' (int_table_prefix, record) {
        var arr_key_values = [],
            arr_value_values = [];

        var num_key_values = this.key_encoding.arr_encodings.length;
        //console.log('num_key_values', num_key_values);

        // Include the table prefix in the key

        each(record, (value, i) => {
            if (i < num_key_values) {
                arr_key_values.push(value);
            } else {
                arr_value_values.push(value);
            }
        });
        var x_prefix = xas2(int_table_prefix);

        var encoded_key_values = this.key_encoding.encode(arr_key_values);


        var res = [Buffer.concat([x_prefix.buffer, encoded_key_values]), this.value_encoding.encode(arr_value_values)];

        // Encodes the key and value to separate buffers.



        return res;

    }

    'decode' (arr_key_value) {
        // And the table prefix has been removed from the buffer before it was even given to the decoder.
        //  Fixed on 02/11/2016

        // 02/08/2017 - Needs some generalised decoding work.
        //  binary-encoding will hold some small info about the data types used, so it will be able to read an array of values relatively easily.
        // we have the key and the value from the db
        var key = arr_key_value[0];
        var value = arr_key_value[1];

        var t_key, t_value;
        var b_key, b_value;

        if (key instanceof Buffer) {
            b_key = key;
        } else {
            t_key = typeof key;


            // 
            if (t_key === 'string') {


                b_key = Buffer.from(key, 'hex');
            }
        }

        if (value instanceof Buffer) {
            b_value = value;
        } else {
            t_value = typeof value;
            if (t_value === 'string') {
                b_value = Buffer.from(value, 'hex');
            }
        }

        // then need to read the table key prefix.

        // Removes the table prefix key as part of the decoder.

        var [table_index_key_prefix, prefix_key_length] = xas2.read(b_key, 0);
        //var prefix_key_length = x_prefix.length;
        //console.log('prefix_key_length', prefix_key_length);
        var key_without_prefix_key = b_key.slice(prefix_key_length);
        var decoded_key = this.key_encoding.decode(key_without_prefix_key);

        //console.log('decoded_key', decoded_key);
        // decode the value too.

        var decoded_value = this.value_encoding.decode(b_value);
        return [decoded_key, decoded_value];
    }
}

var i_type_buffer = function (i_type) {
    var res = Buffer.alloc(1);
    res.writeUInt8(i_type, 0);
    //console.log('res', res);
    return res;
}

Binary_Encoding.Record = Binary_Record_Encoding;

var get_row_buffers = Binary_Encoding.get_row_buffers = (buf_encoded) => {
    // read xas2, see the length of the row

    var pos = 0,
        length, l = buf_encoded.length;
    var old_pos;
    var done = false;
    var res = [];
    var arr_row;

    //console.log('buf_encoded', buf_encoded);
    while (!done) {
        [length, pos] = xas2.read(buf_encoded, pos);
        var buf_key = Buffer.alloc(length);
        buf_encoded.copy(buf_key, 0, pos, pos + length);
        pos = pos + length;

        [length, pos] = xas2.read(buf_encoded, pos);
        var buf_value = Buffer.alloc(length);
        buf_encoded.copy(buf_value, 0, pos, pos + length);
        pos = pos + length;
        arr_row = [buf_key, buf_value];
        //console.log('arr_row', arr_row);
        //cb_row(arr_row);
        res.push(arr_row);
        if (pos >= l) {
            done = true;
        }
    }
    //var res = [buf_key, buf_value];
    return res;
}


var evented_get_row_buffers = Binary_Encoding.evented_get_row_buffers = (buf_encoded, cb_row) => {
    // read xas2, see the length of the row

    var pos = 0,
        length, l = buf_encoded.length;
    var old_pos;
    var done = false;
    var res = [];
    var arr_row;

    //console.log('buf_encoded', buf_encoded);
    while (!done) {
        [length, pos] = xas2.read(buf_encoded, pos);
        var buf_key = Buffer.alloc(length);
        buf_encoded.copy(buf_key, 0, pos, pos + length);
        pos = pos + length;

        [length, pos] = xas2.read(buf_encoded, pos);
        //console.log('[length, pos]', [length, pos]);
        //console.log('length', length);
        var buf_value = Buffer.alloc(length);
        buf_encoded.copy(buf_value, 0, pos, pos + length);
        pos = pos + length;
        //res.push([buf_key, buf_value]);

        arr_row = [buf_key, buf_value];
        //console.log('arr_row', arr_row);
        cb_row(arr_row);
        if (pos >= l) {
            done = true;
        }
    }
    //var res = [buf_key, buf_value];
}


var flexi_encode_item = Binary_Encoding.flexi_encode_item = (item) => {
    // (encode to buffer)

    // Looks like this needs to be upgraded to handle strings / include the data type length.
    //  The item should get encoded with its data type indicator to start with.
    // The data type indicator is likely just 1 byte. Assume it is for the moment.
    //  

    // Flexi encode array should work OK, same as encode to buffer.
    //  Or a difference where it has an item entry saying how many items there are.


    var t_item = tof(item),
        res;
    var i_type;
    // Include item type encoding?
    if (t_item === 'number') {
        // is it a positive integer? xas2 only stores 0 and positive integers
        if (item === 0) {
            res = xas2(item).buffer;
            i_type = XAS2;
        } else if (item > 0 && Number.isInteger(item)) {
            res = xas2(item).buffer;
            i_type = XAS2;
        } else {
            res = Buffer.alloc(8);
            res.writeDoubleBE(item, 0);
            i_type = DOUBLEBE;
        }
    }
    if (t_item === 'string') {
        var buf_str_res = Buffer.from(item, 'utf8');
        // Nothing yet to indicate that its a string though.
        //  Could use value 255 for this?


        var buf_str_len = xas2(buf_str_res.length).buffer;
        //console.log('buf_str_len', buf_str_len);
        //console.log('buf_str_res', buf_str_res);
        res = Buffer.concat([buf_str_len, buf_str_res]);
        i_type = STRING;
    }
    // A way of encoding undefined?

    if (t_item === 'boolean') {
        i_type = item ? BOOL_TRUE : BOOL_FALSE;
        /*
        i_type = 6;
        res = Buffer.alloc(1);
        if (item === true || item === 1) {
            res.writeInt8(1, 0);
        } else {
            res.writeInt8(0, 0);
        }
        */
    }

    if (t_item === 'null') {
        i_type = NULL;
    }

    if (t_item === 'buffer') {
        i_type = BUFFER;
        var l = item.length;
        var buf_buf_len = xas2(l).buffer;
        res = Buffer.concat([buf_buf_len, item]);
    }


    if (t_item === 'date') {
        throw 'stop';
        i_type = BUFFER;
        var l = item.length;
        var buf_buf_len = xas2(l).buffer;

        res = Buffer.concat([buf_buf_len, item]);
    }


    if (t_item === 'array') {
        // say its an array, then encode the length, then sequentially encode all of the items in the array.
        i_type = ARRAY;


        // Encode to buffer puts them all within the buffer, essentally as an implicit array.

        var buf_enc = encode_to_buffer(item);

        //console.log('buf_enc', buf_enc);
        //console.log('buf_enc.length', buf_enc.length);

        // Length in bytes?
        //  Length in terms of number of items to read?
        //   This is preferable as it's smaller.
        //   Makes reading the results harder though. Easier to know the size of the data structure in bytes.

        var arr_bufs = [xas2(buf_enc.length).buffer, buf_enc];
        //console.log('arr_bufs', arr_bufs);
        res = Buffer.concat(arr_bufs);
    }

    var res_arr = [i_type_buffer(i_type)];

    if (res) {
        //var res2 = Buffer.concat([, res]);
        res_arr.push(res);
    } else {
        // 

        //var res2 = Buffer.concat([, res]);
    }
    var res2 = Buffer.concat(res_arr);
    //console.log('res2', res2);
    return res2;
}



var encode_to_buffer = function (arr_items, key_prefix) {

    // If we get an array, we return it encoded as an array.4

    // give it an item here.

    // This here is different to flexi_encode_item.
    //  Want to use flxi encode in more situations, it's simpler.
    //  This seems more about DB rows, should maybe take it out of here and put it into the db part.







    // Putting in a single key prefix.
    //  Seems like it should say that records have got xas2 prefixes.

    // This buffer does not say how it is encoded. It probably should.
    //  It's how rows get encoded.
    //  Rows could be of a data type that uses these key prefixes.

    var a = arguments;
    var arr_xas2_prefix_numbers = [];
    //console.log('a', a);
    if (a.length >= 2) {
        for (var c = 1; c < a.length; c++) {
            arr_xas2_prefix_numbers.push(a[c]);
        }
    }

    var prefix_buffers = [];
    each(arr_xas2_prefix_numbers, (prefix_number) => {
        //console.log('prefix_number', prefix_number);
        var new_buf = xas2(prefix_number).buffer;
        //console.log('new_buf', new_buf);
        prefix_buffers.push(new_buf);
    });

    var i_prefix;
    var arr_bufs = [];
    if (a.length === 1) {
        arr_items = a[0];
    }
    if (a.length === 2) {
        i_prefix = a[0];
        //arr_items = a[1];
        //arr_bufs.push(xas2(i_prefix).buffer);
    }



    each(arr_items, (item) => {
        arr_bufs.push(flexi_encode_item(item));
        //console.log('item', item);
    });
    var res_buffers = [];

    each(prefix_buffers, (item) => {
        res_buffers.push(item);
    });
    each(arr_bufs, (item) => {
        res_buffers.push(item);
    });
    var res = Buffer.concat(res_buffers);
    return res;
}


var join_buffer_pair = Binary_Encoding.join_buffer_pair = (arr_pair) => {
    var res = Buffer.concat([xas2(arr_pair[0].length).buffer, arr_pair[0], xas2(arr_pair[1].length).buffer, arr_pair[1]]);
    return res;
}

var encode_pair_to_buffers = Binary_Encoding.encode_pair_to_buffers = function (arr_pair, key_prefix) {
    var a = arguments;
    var arr_xas2_prefix_numbers = [];
    if (a.length >= 2) {
        for (var c = 1; c < a.length; c++) {
            //console.log('c', c);
            //console.log('a[c]', a[c])
            if (is_defined(a[c])) arr_xas2_prefix_numbers.push(a[c]);
        }
    }
    var prefix_buffers = [];

    each(arr_xas2_prefix_numbers, (prefix_number) => {
        prefix_buffers.push(xas2(prefix_number).buffer);
    });
    var res_key_0 = encode_to_buffer(arr_pair[0]);
    prefix_buffers.push(res_key_0);
    var res_key = Buffer.concat(prefix_buffers);
    var res_val = encode_to_buffer(arr_pair[1]);
    var res = [res_key, res_val];
    return res;


}



var decode_first_value_xas2_from_buffer = (buf) => {
    var i_prefix, pos;
    [i_prefix, pos] = xas2.read(buf, 0);
    return i_prefix;
}

// split_length_item_encoded_buffer
//  where each item in there is a buffer
//   it would have its own encoding.

var split_length_item_encoded_buffer = (buf) => {
    var res = [];
    var pos = 0;
    var l = buf.length,
        l_item, buf_item, next_pos;

    var read = function () {
        [l_item, pos] = xas2.read(buf, pos);
        //res.push(xas2(l_item).buffer);
        buf_item = Buffer.alloc(l_item);
        next_pos = pos + l_item;
        buf.copy(buf_item, 0, pos, next_pos);
        res.push(buf_item);
        pos = next_pos;

    }
    while (pos < l) {
        read();
    }
    return res;

}

var split_length_item_encoded_buffer_to_kv = (buf) => {
    var res = [];
    var pos = 0;
    var l = buf.length,
        l_item, buf_item, next_pos;

    var key, value;

    var read = function () {
        [l_item, pos] = xas2.read(buf, pos);
        //res.push(xas2(l_item).buffer);
        buf_item = Buffer.alloc(l_item);
        next_pos = pos + l_item;
        buf.copy(buf_item, 0, pos, next_pos);

        if (key) {
            res.push([key, buf_item]);
            key = null;
        } else {
            key = buf_item;
        }

        //res.push(buf_item);
        pos = next_pos;

    }
    while (pos < l) {
        read();
    }
    return res;

}



var decode_length_item_encoded_buffer = (buf, num_xas2_prefixes = 0) => {
    var res = [];
    var pos = 0;
    var l = buf.length,
        l_item, buf_item, next_pos;

    var read = function () {
        [l_item, pos] = xas2.read(buf, pos);
        //res.push(xas2(l_item).buffer);
        buf_item = Buffer.alloc(l_item);
        next_pos = pos + l_item;
        buf.copy(buf_item, 0, pos, next_pos);
        res.push(decode_buffer(buf_item, num_xas2_prefixes));
        pos = next_pos;

    }
    while (pos < l) {
        read();
    }
    return res;

}


/*
const XAS2 = 0;
const DOUBLEBE = 1;

const STRING = 4;
const BOOL_TRUE = 6;
const BOOL_FALSE = 7;
const NULL = 8;
const BUFFER = 9;
*/

// Decode from some points only?
//  For the moment, have the array as a sub-buffer.

// decode recursive
//  if it finds a buffer inside, decodes that

var full_decode = function (buf, num_xas2_prefixes = 0) {
    var decoded = decode_buffer(buf, num_xas2_prefixes);

    // buffer in an array...
    //console.log('1) decoded');

    var is_fully_decoded = !(decoded[0] instanceof Buffer);
    while (!is_fully_decoded) {
        //console.log('decoded[0]', decoded[0]);
        decoded[0] = decode_buffer(decoded[0], num_xas2_prefixes);
        is_fully_decoded = !(decoded[0] instanceof Buffer);
    }

    // Maybe should go through sub-items?
    //  Have a full-decode option within decode_buffer, perhaps.
    return decoded;
}


// Want to encode and decode single items


// Having some inconsistencies to do with encoding and decoding arrays, and getting consistent rules for that.
//  Items may get added sequentially without them having been in an array.

// Make it so if they are explicitly stored with an array, it returns that array, but no extra array for results.

// Will return its single item if it was an array that was given as an item.


// Or have standard decoding behaviour to stick everything in an (extra) array?

// Really is best to have encode <> decode symmetry.
//  Generally will encode a bunch of items together, but they won't be encoded as an array necessrily, but would need to be decoded as am array.
//  Need to encode an array into a record, but don't really think of it as an array when it's encoded.

// Wrapping it all in an array makes sense when there are multiple items to decode.


// encode_array_to_buf
// decode_buf_to_array

// Encoding and decoding is proving to be another hurdle here.
//  Standard encode and decode too would be useful.

// For encoding records to a buffer, don't want to indicate they are a record or array.
//  When encoding other data, should say what data type it is.


// Binary_Encoding.db_encode, db_decode
//  In other situations, just encode and decode.
//   Encode and decode would not need to put the data into an array by default, apart from when decoding data inside arrays.



// db_encode, db_decode, encode, decode


// Or, understanding that it puts it in an array each time there is nothing to enclose it, and be fine with it.
//  That means fishing it out of the array wherever necessary.

// Maybe that's the behaviour of before
//  Not a bug, a feature. ???

// Being able to get symmetrical encode -> decode seems important though.




// Or if it gets multiple reads, it puts them in an array.


// I think we need significantly more work on decode, but some changes to encode could work as well.












// Decoding root level items as an array
//  Then need to be able to decode items inside that as though they are not arrays.
//  Require array to enclode all encoded items?


// Different encode and decode methods seem important here.


// Encoding to buffer where its implied everything is in an array
// Encoding a single data item to a buffer

//  Implied arrays
//   As in the keys and records don't actually say they are an array of data.
//   More advanced / indexed record encoding and decoding could help.
//    Different types of record encoding could speed up retrieval of specific fields within any record.

// Should maybe split up record encoding here.
//  Implied array with xas2 prefixes.

// 

// decode_xas2_prefixed_implied_array
//  decode_item
//  


// 11/03/2018 - This encoding and decoding problem is a roadblock to getting the database working properly.
//  Think we need much more clarity about that.

// Maybe will need quite a signigicant refactoring of calls.


// encode, decode being to encode items

// encode and decoding implicit arrays.


// Get rid of encode_buffer, maybe flexi_encode for the moment,








var decode_buffer = Binary_Encoding.decode_buffer = function (buf, num_xas2_prefixes = 0) {

    // Make it so that when encoding an array with flexi_encode, it always encodes it as an array

    let i_byte_value_type;
    let inner = (buf, num_xas2_prefixes = 0) => {
        var arr_items = [];
        var i_prefix;
        var pos = 0;

        let res;
        //console.log('num_xas2_prefixes', num_xas2_prefixes);

        // A buffer can say it's got these prefixes.



        while (num_xas2_prefixes > 0) {
            //console.log('1) pos', pos);
            [i_prefix, pos] = xas2.read(buf, pos);
            //console.log('2) pos', pos);
            arr_items.push(i_prefix);
            num_xas2_prefixes = num_xas2_prefixes - 1;
        }

        var l = buf.length;
        //console.log('l', l);

        // Need to read the buffer at multiple points to see what the item is encoded as.

        // May as well have the new decoding here.

        //i_byte_value_type;
        var complete = false;

        var buf_val, val;
        var i_res, num_res, str_len, str_res, arr_len, arr_res, buf_len;
        var compression_type, compressed_length, buf_uncomp;

        //console.log('pos', pos);
        //if (pos >= l - 1) complete = true;
        if (pos >= l) complete = true;

        // If reading just one item, return that item.




        //If returning just one result, then don't put it in an array?

        // If there is only one item found in the buffer...

        // Reading a single array from it.
        //  Different to reading multiple items one after the other.


        // Reading single item mode...
        //  An array should be read as an array, 

        let read_count = 0;


        while (!complete) {
            i_byte_value_type = buf.readUInt8(pos++);
            //console.log('i_byte_value_type', i_byte_value_type);
            //console.log('buf', buf);
            //console.log('pos', pos);
            //console.log('has_xas2_prefix', has_xas2_prefix);

            // Could have BOOL_TRUE and BOOL_FALSE as separate items.


            // 0 - xas2 number
            // 1 - 64 bit BE float
            // 2 - unix time in ms           t
            // 3 - unix time range in ms     [t, t]
            // 4 - string                    [xas2(l), str]  'utf8'
            // 5 - indexed xas2 number, representing a string
            // 6 - bool, 1 byte

            if (i_byte_value_type === XAS2) {
                [i_res, pos] = xas2.read(buf, pos);
                arr_items.push(i_res);
            } else if (i_byte_value_type === DOUBLEBE) {
                num_res = buf.readDoubleBE(pos);
                arr_items.push(num_res);
                pos = pos + 8;
            } else if (i_byte_value_type === 2) {

            } else if (i_byte_value_type === 3) {

            } else if (i_byte_value_type === STRING) {
                [str_len, pos] = xas2.read(buf, pos);
                // It's length encoded in the buffer.
                //console.log('str_len', str_len);
                str_res = buf.toString('utf8', pos, pos + str_len);
                arr_items.push(str_res);
                pos = pos + str_len;

            } else if (i_byte_value_type === 5) {

            } else if (i_byte_value_type === BOOL_TRUE) {
                arr_items.push(true);
            } else if (i_byte_value_type === BOOL_FALSE) {
                arr_items.push(false);
            } else if (i_byte_value_type === NULL) {
                arr_items.push(null);
            } else if (i_byte_value_type === BUFFER) {
                throw 'stop';
                arr_items.push(null);
            } else if (i_byte_value_type === ARRAY) {
                //console.log('reading array');


                [buf_len, pos] = xas2.read(buf, pos);


                var buf_arr = Buffer.alloc(buf_len);
                buf.copy(buf_arr, 0, pos, pos + buf_len);

                let arr_new = [];

                //console.log('buf_arr', buf_arr);
                //console.log('buf_len', buf_len);

                //var decoded = [Binary_Encoding.decode_buffer(buf_arr)];

                // 

                //console.log('* decoded', JSON.stringify(decoded));
                //arr_items.push(decoded[0]);
                //pos = pos + buf_len;



                if (buf_len > 0) {
                    var decoded = [Binary_Encoding.decode_buffer(buf_arr)];

                    // 

                    console.log('decoded', JSON.stringify(decoded));
                    //arr_items.push(decoded);

                    //arr_items.push(decoded);
                    arr_items.push.apply(arr_items, decoded);

                    pos = pos + buf_len;
                } else {
                    arr_items.push([]);
                }




            } else if (i_byte_value_type === COMPRESSED_BUFFER) {
                //throw 'stop';
                //arr_items.push(null);
                // Need to decompress it, and then process the original value(s).
                [compression_type, pos] = xas2.read(buf, pos);
                [compressed_length, pos] = xas2.read(buf, pos);

                console.log('compression_type', compression_type);
                console.log('compressed_length', compressed_length);
                var buf_comp = Buffer.alloc(compressed_length);
                buf.copy(buf_comp, 0, pos, pos + compressed_length);

                if (compression_type === COMPRESSION_ZLIB_9) {
                    buf_uncomp = zlib_uncompress_buffer(buf_comp);
                } else {
                    throw 'unknown compression type ' + compression_type;
                }

                // just return the buffer?
                //var decoded = 
                arr_items.push(buf_uncomp);
                pos = pos + compressed_length;


                //var decoded = decode_buffer(buf_uncomp);


            } else {
                console.trace();
                throw 'Unexpected i_byte_value_type', i_byte_value_type;
            }
            read_count++;
            if (pos >= l) complete = true;
            // then if it's complete, and there is only 1 result in the array...
            //  and that item's an array...






        }

        // Seems like a bit of a hack. Would fix / break things in other places.
        //  Need to specifically cater for returning an array with length 1.

        console.log('read_count', read_count);
        console.log('arr_items', arr_items);

        /*

        if (read_count === 1) {
            return arr_items[0];
        } else {
            return arr_items;
        }
        */

        console.log('arr_items', arr_items);
        console.log('i_byte_value_type', i_byte_value_type);
        if (i_byte_value_type != ARRAY) {
            return arr_items[0];
        } else {
            return arr_items;
        }
        //return arr_items;
    }


    let res = inner(buf, num_xas2_prefixes);
    console.log('res', res);

    console.log('res.length', res.length);

    if (res.length === 1 && i_byte_value_type != ARRAY) {
        return res[0];
    } else {
        return res;
    }

    //return res;
    //return res[0];



    //  
    //console.log('decode buf', buf);

    // This would change the way that records get encoded / decoded though.
    //  That could be tricky for using data that's already been collected.
    //   I was not expecting this bug. It seems likely to break the usage of the existing database. Will be more explicit about writing arrays into the buffer where it is an array of data.

    // Definitely seems very ticky to get the backups loading OK if we change the way that data gets encoded / decoded.
    //  Could have problems with arrays such as primary keys.

    // Best way would be to copy / download the database, and have a custom process that reads through all of the DB's records, and reads each record, possibly with some specific decoding options, possibly a previous version of
    //  Binary_Encoding.

    // So best to fix the encoding, make a new server, get it running, maybe 2 servers for redundency, have a fully tested new version.
    //  Make and test a util that reads through a whole db, decoding records with the old type of encoding, or options / workarounds set for the new type.
    //   Use events from that system to get data to put into a new, well running DB.



    // Fixing the encoding, and testing it on the xeon box would be helpful.
    //  Seems to require more low level work on the underlying db and data platform.

    // Very soon want to have the exchange data get reliably stored and retrieved. Need to set this up on the Xeon, then carefully on 2 Montreal servers.
    //  Want enough capability for the 2 Montreal servers to provide updates to the Xeon server, which will amalgamate the data.


    // Need some variety to the decoding of the buffer. If there are multiple items in the buffer, it puts them into an array.
    //  Otherwise, it gives the single item, which could be an array.


    // Always an array of items.

    // The very first could be an xas2 number for a prefix

    //console.log('has_xas2_prefix', has_xas2_prefix);


    // Should not automatically decode any list of items into an array.
    //  Sequence of xas2 numbers will always be in an array.
    //   So if there are key prefixes, put it around an array.

    // This buffer encoding generally denotes a list of items, in an array.
    //  The array can be assumed in some situations but not others.

    // This seems like it should return an array of items in some cases.
    //  In other cases, it should be treated as though it is decoding a single item. That item could be an array with multiple items.

    // Need it so that in cases where there is just one item encoded, it returns that item, not an array of items.


    // If there are any xas2 prefixes it puts all of the results in an array.

    // Improved encoding and decoding, then testing that within the running system, will do a lot.
    //  Then deploy it to 2 servers.
    //  Then download the data from server1, and read through it in a new process.



    // Don't necessarily put the items into an array.
    //  In many cases, don't want to return an array.






    /*
    if (arr_items.length === 1) {

        / *
        if (i_byte_value_type === ARRAY) {
            //return arr_items;

            // the length of that item?
            //  



            return arr_items[0];
        } else {
            
        }
        * /

        // Generally there will just be one of these result items.
        console.log('arr_items[0]', JSON.stringify(arr_items[0]));

        if (Array.isArray(arr_items[0])) {
            return arr_items[0];
        } else {

            return arr_items[0];
        }




    } else {
        return arr_items;
    }
    */

    //return arr_items[0];
    //return res;

    //if ()

}

Binary_Encoding.decode = decode_buffer;
Binary_Encoding.encode = flexi_encode_item;


Binary_Encoding.join_buffer_pair = join_buffer_pair;
Binary_Encoding.split_length_item_encoded_buffer_to_kv = split_length_item_encoded_buffer_to_kv;
Binary_Encoding.split_length_item_encoded_buffer = split_length_item_encoded_buffer;
Binary_Encoding.decode_first_value_xas2_from_buffer = decode_first_value_xas2_from_buffer;
Binary_Encoding.encode_to_buffer = encode_to_buffer;
Binary_Encoding.full_decode = full_decode;
Binary_Encoding.compress_buffer_zlib9 = compress_buffer_zlib9;

module.exports = Binary_Encoding;




if (require.main === module) {


    let test_encode_decode = (item) => {
        let b = Binary_Encoding.encode(item);
        console.log();

        let a2 = Binary_Encoding.decode(b);
        console.log('item', item);
        console.log('b', b);
        console.log('a2', a2);

        let pass = deep_equal(item, a2);
        console.log('pass', pass);
    }

    let a1 = [
        [1, 2, 3],
        [4, 5, 6]
    ];

    // Decoding it always seems to put the results into an array.
    //  Don't want that.


    test_encode_decode([]);
    test_encode_decode([
        [],
        []
    ]);
    //
    test_encode_decode([1, 2]);
    test_encode_decode(['James']);


    //test_encode_decode(a1);
    /*

    test_encode_decode('James');
    
    
    */


    // a1 [ [ 1, 2, 3 ], [ 4, 5, 6 ] ]
    //a2 [ [ [ 1, 2, 3 ], [ 4, 5, 6 ] ] ]




} else {
    //console.log('required as a module');
}