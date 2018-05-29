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

// Or encode as an array of buffers for the moment.
//  That seems OK, general enough.
//   At some stages would need to decode the buffers, or split them.

 
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
const OBJECT = 11;
const COMPRESSED_BUFFER = 12;


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

    constructor(spec) {
        var arr_encodings = [];
        if (Array.isArray(spec)) {
            arr_encodings = spec;
        }
        if (arr_encodings) this.arr_encodings = arr_encodings;
    }
    encode(unencoded) {
        return Binary_Encoding.encode_to_buffer(unencoded);
    }
    decode(buffer, ignore_prefix) {
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


class Binary_Record_Encoding {
    constructor(spec) {
        this.encoding = spec;
        this.key_encoding = new Binary_Encoding(spec.key);
        this.value_encoding = new Binary_Encoding(spec.value);
    }

    'encode_query'(query) {
        return this.key_encoding.encode_query(query);
    }

    // And a tables key prefix
    //  Something to indicate we are in the tables section of the database

    'encode'(int_table_prefix, record) {
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

    'decode'(arr_key_value) {
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

    //console.log('t_item', t_item);

    //console.log('flexi_encode_item t_item', t_item);
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

    if (t_item === 'object') {
        // String key, then the value encoded into a buffer
        //  prefixed with its encoded length

        //console.log('Object.keys(item)', Object.keys(item));
        //console.log('item', item);

        //console.log("'buffer' in item " + ('buffer' in item));

        if ('buffer' in item) {
            // And then could have a specific item type too.
            //  Could say it's a buffer but of a specific item type.
            //  Want it to decode as a buffer as normal.
            //   First part would itentify its specific item type.
            //   This will help to tell the difference between a key, record, record list, row list etc.
            //    There will be a few types used in communication representing some useful OO classes that will cover a lot of data quite simply.
            //     Could just have a specific encoding type at the beginning of the buffer.

            // a buffer xas2 prefix
            i_type = BUFFER;

            // It's still a Buffer...

            let item_buf = item.buffer;

            if ('buffer_xas2_prefix' in item) {
                let prefix_buf = item.buffer_xas2_prefix;
                //console.log('item_buf', item_buf);
                //console.log('item.buffer_xas2_prefix', item.buffer_xas2_prefix);
                //console.log('prefix_buf', prefix_buf);
                //console.log('prefix_buf.length + item_buf.length', prefix_buf.length + item_buf.length);

                //res = Buffer.concat([xas2(item_buf.length).buffer, item_buf]);

                // Trouble decoding these.

                // Want it so that some kinds of buffer have an extra encoding digit right at the beginning.
                //  It's an XAS2 prefix.
                //  Not so sure about enocoding / decoding like this.
                //  Idea is to help identify what a message contains.




                res = Buffer.concat([xas2(prefix_buf.length + item_buf.length).buffer, prefix_buf, item_buf]);
                //console.log('res with prefix', res);
            } else {

                res = Buffer.concat([xas2(item_buf.length).buffer, item_buf]);
            }


        } else {
            //console.log('encoding object');
            i_type = OBJECT;

            let prop;
            let arr_bufs_res = [];
            let buf_item_item, item_item, buf_item_item_name;

            for (prop in item) {
                item_item = item[prop];
                buf_item_item_name = Buffer.from(prop);
                buf_item_item = flexi_encode_item(item_item);
                //console.log('item_item', item_item);
                //console.log('buf_item_item', buf_item_item);
                arr_bufs_res.push(xas2(buf_item_item_name.length).buffer);
                arr_bufs_res.push(buf_item_item_name);
                arr_bufs_res.push(xas2(buf_item_item.length).buffer);
                arr_bufs_res.push(buf_item_item);
            }

            // Have the length of the object at the start for better skipping and reading.
            //console.log('arr_bufs_res', arr_bufs_res);

            let buf_res = Buffer.concat(arr_bufs_res);
            res = Buffer.concat([xas2(buf_res.length).buffer, buf_res]);
        }




    }

    // Maybe types should be as xas2.
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


let xas2_sequence_to_array_buffer = (buf_xas2_sequence) => {


    let res = Buffer.concat([xas2(ARRAY).buffer, xas2(buf_xas2_sequence.length).buffer, buf_xas2_sequence]);
    return res;
}


// encode_to_buffer_use_kps


let encode_to_buffer_use_kps = (arr_items, num_kps) => {
    let c = 0,
        pos = 0,
        i, l = arr_items.length;

    let arr_bufs = new Array(l);

    while (c < num_kps) {
        arr_bufs[c] = new xas2(arr_items[c]).buffer;


        c++;
    }
    // encode the rest

    while (c < l) {
        arr_bufs[c] = flexi_encode_item(arr_items[c]);
        c++;
    }

    var res = Buffer.concat(arr_bufs);
    return res;



}

var encode_to_buffer = function (arr_items, key_prefix) {
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



// move to database encoding
//  then may be worth separating it out of the project to keep it stable.
//   keep it on an old and low version for a while hopefully.
//   Then the encoding would be better separated to make run with C / C++






var decode_first_value_xas2_from_buffer = (buf) => {
    //console.log('buf', buf);
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
        //console.log('l_item', l_item);
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



// Will be used to make selection from records a lot faster.
//  Less server-side CPU usage.


// xas2.read_buffer - now exists
//  does not read an xas2, just returns the buffer. xas2 needed because we don't know the item length in advance.

// Does not decode to make the index-based selection. Useful when selecting on the server, transferring results to the client.

//  and return the total read too.

// Starting index - meaning we process a buffer, but consider each item to be index_number plus the starting_index.



// Think we need a split_encoded_buffer.
//  It skips through the buffer, copying data to result buffers.
//   This will be useful in unpaging, where the client may still want access to the lower level buffers as if it had not been through the paging system.
//   Designing it now so that the client and the server calls have got the same APIs, but in the client case there are various steps in between that get hidden in normal operation, though parameters
//    for it will be available.

// Moving towards more processing of encoded data.
//  I expect it to be much faster, or at least eliminate one possible bottleneck while some others will remain.
//  The binary encoding functions will also be relatively easy to port to C/C++, and if widely used in the app will gain a nice speedup from doing that.

// Buffer select item.
// Could maybe select all of the items at once though.



// get value at
//  starting pos
//  kps can be skipped before, want kps to be less of a focus here.



// want to get something to skip through reading it.

// read_skip()

// get_pos_list
//  could return a Typed Array.

let get_pos = (buf, idx, pos = 0) => {
    var l = buf.length,
        complete = false;
    var i_byte_value_type, buffer_length;


    // Will need to skip through.

    let i = 0;

    if (i >= idx || pos >= l) complete = true;
    // Seems to have fixed retrieval problem.
    //if (i >= idx - 1 || pos >= l) complete = true;

    while (!complete) {
        i_byte_value_type = buf.readUInt8(pos++);

        if (i_byte_value_type === XAS2) {
            [i_res, pos] = xas2.skip(buf, pos);
        } else if (i_byte_value_type === DOUBLEBE) {
            pos = pos + 8;
        } else if (i_byte_value_type === 2) {

        } else if (i_byte_value_type === 3) {

        } else if (i_byte_value_type === STRING) {
            [str_len, pos] = xas2.read(buf, pos);
            pos = pos + str_len;
        } else if (i_byte_value_type === 5) {

        } else if (i_byte_value_type === 5) {

        } else if (i_byte_value_type === BOOL_TRUE) {
            //arr_items.push(true);
        } else if (i_byte_value_type === BOOL_FALSE) {
            //arr_items.push(false);
        } else if (i_byte_value_type === NULL) {
            //arr_items.push(null);
        } else if (i_byte_value_type === BUFFER) {
            [buf_len, pos] = xas2.read(buf, pos);
            //var buf2 = Buffer.alloc(buf_len);
            buf.copy(buf2, 0, pos, pos + buf_len);
            arr_items.push(buf2);
        } else if (i_byte_value_type === ARRAY) {
            [buf_len, pos] = xas2.read(buf, pos);
            pos = pos + buf_len;
        } else if (i_byte_value_type === OBJECT) {
            let pos_start = pos;
            [buf_len, pos] = xas2.read(buf, pos);
            let read_end = pos_start + buf_len;
            //let obj = {};

            let k_l, v_l, buf_k, buf_v, k, v;

            let read_complete = false;

            while (!read_complete) {
                [k_l, pos] = xas2.read(buf, pos);
                //console.log('k_l', k_l);
                buf_k = Buffer.alloc(k_l);
                //buf.copy(buf_k, 0, pos, pos + buf_len);
                pos = pos + k_l;
                //k = buf_k.toString();
                [v_l, pos] = xas2.read(buf, pos);
                //console.log('v_l', v_l);
                //buf_v = Buffer.alloc(v_l);
                //buf.copy(buf_v, 0, pos, pos + buf_len);
                pos = pos + v_l;
                //v = decode_buffer(buf_v)[0];
                //obj[k] = v;
                if (pos >= read_end) read_complete = true;
            }
            //arr_items.push(obj);
        } else if (i_byte_value_type === COMPRESSED_BUFFER) {
            [compression_type, pos] = xas2.read(buf, pos);
            [compressed_length, pos] = xas2.read(buf, pos);
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
            //throw 'stop';
            throw 'Unexpected i_byte_value_type', i_byte_value_type;
        }

        i++;

        //console.log('i', i);
        //console.log('idx', idx);

        if (i >= idx - 1 || pos >= l) complete = true;
    }

    return pos;


    // However, could split the encoding types into:
    //  length by decode item (xas2)
    //  length is encoded immediately after the item type id
    //  fixed length so no need to calculate or decode it.




}

let read_value = (buf, pos = 0) => {
    let i_byte_value_type = buf.readUInt8(pos++);

    if (i_byte_value_type === XAS2) {
        // Copy the xas2...
        //console.log('reading xas2');
        // read buffer, and return the full thing.
        [buf_xas2_item, pos] = xas2.read_buffer(buf, pos);
        buf_item = Buffer.concat([xas2(0).buffer, buf_xas2_item]);
        //console.log('[buf_item, pos]', [buf_item, pos]);

        //[i_res, pos] = xas2.skip(buf, pos);
    } else if (i_byte_value_type === DOUBLEBE) {
        // Read this value.
        //  copy given length to other buffer
        buf_item = Buffer.alloc(9);
        buf_item.writeUInt8(i_byte_value_type, 0);
        buf.copy(buf_item, 1, pos, pos + 8);
        pos = pos + 8;
        //} else if (i_byte_value_type === 2) {

        //} else if (i_byte_value_type === 3) {

    } else if (i_byte_value_type === STRING || i_byte_value_type === BUFFER || i_byte_value_type === ARRAY || i_byte_value_type === OBJECT) {
        // xas2 read return the number of characters read too?
        let orig_pos = pos;
        [len, pos, xas2_buffer_length] = xas2.read(buf, pos);

        xas2_buffer_length = pos - orig_pos;
        // need to know this length in order to write the string back or copy it.

        //console.log('len', len);
        //console.log('xas2_buffer_length', xas2_buffer_length);

        buf_item = Buffer.alloc(1 + xas2_buffer_length + len);
        buf.copy(buf_item, 0, orig_pos - 1, orig_pos + len + xas2_buffer_length + 1);

        pos = pos + len;
    } else if (i_byte_value_type === BOOL_TRUE || i_byte_value_type === BOOL_FALSE || i_byte_value_type === NULL) {
        // Size 1 byte.
        //arr_items.push(true);
        buf_item = Buffer.alloc(1);
        buf_item.writeUInt8(i_byte_value_type, 0);

    } else {
        console.trace();
        throw 'stop';
    }

    return [buf_item, pos];

}

let get_value_at = (buf, idx, pos = 0) => {
    let res;
    // skip until that place.
    pos = get_pos(buf, idx, pos);
    //console.log('pos', pos);
    //console.log('buf', buf);

    [res, pos] = read_value(buf, pos);
    //console.log('res', res);

    return res;

    // Then need to read a single value.
    // Could do with a function for that.





}




// copy all buffers to result buffer

let buffer_select_from_buffer = (buf, arr_int_indexes, num_kps_encoded, num_kps_to_skip, starting_idx = 0) => {

    let arr_buf_res = [];
    var pos = 0;
    var l = buf.length;
    var i_byte_value_type, buffer_length;
    var complete = false;

    let map_indexes_to_select = {};
    each(arr_int_indexes, item => map_indexes_to_select[item - starting_idx] = true);



    let kp, num_read_kps = 0,
        num_skipped_kps = 0;
    // need to read the KPs.

    //console.log('num_kps, num_kps_to_skip', num_kps_encoded, num_kps_to_skip);

    while (num_read_kps++ < num_kps_encoded) {
        [kp, pos] = xas2.read(buf, pos);

        //console.log('kp', kp);

        if (num_skipped_kps < num_kps_to_skip) {
            num_skipped_kps++;
            num_read_kps++;
        } else {
            num_read_kps++
            arr_items.push(kp);
        }

    }


    if (pos >= l) complete = true;




    // Skip necessary kps.



    // Skips decoding of items not in the right idx.

    let c_idx = 0;

    let buf_item, buf_xas2_item;

    while (!complete) {
        i_byte_value_type = buf.readUInt8(pos++);
        //console.log('i_byte_value_type', i_byte_value_type);


        if (map_indexes_to_select[c_idx++]) {
            // read it and copy to result buffer, don't decode it.

            if (i_byte_value_type === XAS2) {

                // Copy the xas2...

                //console.log('reading xas2');

                // read buffer, and return the full thing.


                [buf_xas2_item, pos] = xas2.read_buffer(buf, pos);

                buf_item = Buffer.concat([xas2(0).buffer, buf_xas2_item]);

                //console.log('[buf_item, pos]', [buf_item, pos]);

                //[i_res, pos] = xas2.skip(buf, pos);
            } else if (i_byte_value_type === DOUBLEBE) {
                // Read this value.
                //  copy given length to other buffer

                buf_item = Buffer.alloc(9);
                buf_item.writeUInt8(i_byte_value_type, 0);
                buf.copy(buf_item, 1, pos, pos + 8);



                pos = pos + 8;
                //} else if (i_byte_value_type === 2) {

                //} else if (i_byte_value_type === 3) {

            } else if (i_byte_value_type === STRING || i_byte_value_type === BUFFER || i_byte_value_type === ARRAY || i_byte_value_type === OBJECT) {
                // xas2 read return the number of characters read too?
                let orig_pos = pos;
                [len, pos, xas2_buffer_length] = xas2.read(buf, pos);

                xas2_buffer_length = pos - orig_pos;
                // need to know this length in order to write the string back or copy it.

                //console.log('len', len);
                //console.log('xas2_buffer_length', xas2_buffer_length);

                buf_item = Buffer.alloc(1 + xas2_buffer_length + len);
                buf.copy(buf_item, 0, orig_pos - 1, orig_pos + len + xas2_buffer_length + 1);

                pos = pos + len;
            } else if (i_byte_value_type === BOOL_TRUE || i_byte_value_type === BOOL_FALSE || i_byte_value_type === NULL) {
                // Size 1 byte.

                //arr_items.push(true);
                buf_item = Buffer.alloc(1);
                buf_item.writeUInt8(i_byte_value_type, 0);

            } else {
                console.trace();
                throw 'stop';
            }

            arr_buf_res.push(buf_item);





        } else {
            // skip this, advance the position
            if (i_byte_value_type === XAS2) {
                [i_res, pos] = xas2.skip(buf, pos);
            } else if (i_byte_value_type === DOUBLEBE) {
                pos = pos + 8;
            } else if (i_byte_value_type === 2) {

            } else if (i_byte_value_type === 3) {

            } else if (i_byte_value_type === STRING) {
                [str_len, pos] = xas2.read(buf, pos);
                pos = pos + str_len;
            } else if (i_byte_value_type === 5) {

            } else if (i_byte_value_type === 5) {

            } else if (i_byte_value_type === BOOL_TRUE) {
                //arr_items.push(true);
            } else if (i_byte_value_type === BOOL_FALSE) {
                //arr_items.push(false);
            } else if (i_byte_value_type === NULL) {
                //arr_items.push(null);
            } else if (i_byte_value_type === BUFFER) {
                [buf_len, pos] = xas2.read(buf, pos);
                //var buf2 = Buffer.alloc(buf_len);
                buf.copy(buf2, 0, pos, pos + buf_len);
                arr_items.push(buf2);
            } else if (i_byte_value_type === ARRAY) {
                [buf_len, pos] = xas2.read(buf, pos);
                pos = pos + buf_len;
            } else if (i_byte_value_type === OBJECT) {
                let pos_start = pos;
                [buf_len, pos] = xas2.read(buf, pos);
                let read_end = pos_start + buf_len;
                //let obj = {};

                let k_l, v_l, buf_k, buf_v, k, v;

                let read_complete = false;

                while (!read_complete) {
                    [k_l, pos] = xas2.read(buf, pos);
                    //console.log('k_l', k_l);
                    buf_k = Buffer.alloc(k_l);
                    //buf.copy(buf_k, 0, pos, pos + buf_len);
                    pos = pos + k_l;
                    //k = buf_k.toString();
                    [v_l, pos] = xas2.read(buf, pos);
                    //console.log('v_l', v_l);
                    //buf_v = Buffer.alloc(v_l);
                    //buf.copy(buf_v, 0, pos, pos + buf_len);
                    pos = pos + v_l;
                    //v = decode_buffer(buf_v)[0];
                    //obj[k] = v;
                    if (pos >= read_end) read_complete = true;
                }
                //arr_items.push(obj);
            } else if (i_byte_value_type === COMPRESSED_BUFFER) {
                [compression_type, pos] = xas2.read(buf, pos);
                [compressed_length, pos] = xas2.read(buf, pos);
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
                //throw 'stop';
                throw 'Unexpected i_byte_value_type', i_byte_value_type;
            }
        }
        if (pos >= l) complete = true;
    }

    return [Buffer.concat(arr_buf_res), c_idx];


}


// Want to encode and decode single items
//  This looks very skippable for selecting individual items from a buffer.

let decode_buffer_select_by_index = (buf, arr_int_indexes, num_kps, num_kps_to_skip, idx_start = 0) => {

    // number of kps, so we can read them.

    // number of kps to skip...
    //  to leave out the kp

    // 

    //console.log('arr_int_indexes', arr_int_indexes);
    //console.log('num_kps, num_kps_to_skip', num_kps, num_kps_to_skip);





    var arr_items = [];
    var pos = 0;
    var l = buf.length;

    var i_byte_value_type;
    var complete = false;

    var buf_val, val;
    var i_res, num_res, str_len, str_res, arr_len, arr_res, buf_len;
    var compression_type, compressed_length, buf_uncomp;

    let map_indexes_to_select = {};




    // Could use the subtraction here.

    each(arr_int_indexes, item => map_indexes_to_select[item - idx_start] = true);

    //console.log('pos', pos);
    //if (pos >= l - 1) complete = true;



    // Skips decoding of items not in the right idx.

    let c_idx = 0;
    let num_skipped_kps = 0;
    let num_read_kps = 0;

    //console.log('buf', buf);

    let kp;
    // need to read the KPs.

    console.log('num_kps, num_kps_to_skip', num_kps, num_kps_to_skip);

    while (num_read_kps++ < num_kps) {
        [kp, pos] = xas2.read(buf, pos);

        //console.log('kp', kp);

        if (num_skipped_kps < num_kps_to_skip) {
            num_skipped_kps++;
            num_read_kps++;
        } else {
            num_read_kps++
            arr_items.push(kp);
        }

    }

    //console.log('arr_items', arr_items);





    if (pos >= l) complete = true;


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


        if (map_indexes_to_select[(c_idx++)]) {



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
                [buf_len, pos] = xas2.read(buf, pos);
                var buf2 = Buffer.alloc(buf_len);
                buf.copy(buf2, 0, pos, pos + buf_len);
                arr_items.push(buf2);
                pos = pos + buf_len;
            } else if (i_byte_value_type === ARRAY) {
                [buf_len, pos] = xas2.read(buf, pos);
                var buf_arr = Buffer.alloc(buf_len);
                buf.copy(buf_arr, 0, pos, pos + buf_len);
                var decoded = Binary_Encoding.decode_buffer(buf_arr);
                arr_items.push(decoded);
                pos = pos + buf_len;
            } else if (i_byte_value_type === OBJECT) {
                let pos_start = pos;
                [buf_len, pos] = xas2.read(buf, pos);
                let read_end = pos_start + buf_len;
                let obj = {};

                let k_l, v_l, buf_k, buf_v, k, v;

                let read_complete = false;

                while (!read_complete) {
                    [k_l, pos] = xas2.read(buf, pos);
                    //console.log('k_l', k_l);
                    buf_k = Buffer.alloc(k_l);
                    buf.copy(buf_k, 0, pos, pos + k_l);
                    pos = pos + k_l;
                    k = buf_k.toString();
                    [v_l, pos] = xas2.read(buf, pos);
                    //console.log('v_l', v_l);
                    buf_v = Buffer.alloc(v_l);
                    buf.copy(buf_v, 0, pos, pos + v_l);
                    pos = pos + v_l;
                    v = decode_buffer(buf_v)[0];
                    obj[k] = v;
                    if (pos >= read_end) read_complete = true;
                }
                arr_items.push(obj);
            } else if (i_byte_value_type === COMPRESSED_BUFFER) {
                [compression_type, pos] = xas2.read(buf, pos);
                [compressed_length, pos] = xas2.read(buf, pos);
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
                //throw 'stop';
                throw 'Unexpected i_byte_value_type', i_byte_value_type;
            }


        } else {

            if (i_byte_value_type === XAS2) {
                [i_res, pos] = xas2.skip(buf, pos);
            } else if (i_byte_value_type === DOUBLEBE) {
                pos = pos + 8;
            } else if (i_byte_value_type === 2) {

            } else if (i_byte_value_type === 3) {

            } else if (i_byte_value_type === STRING) {
                [str_len, pos] = xas2.read(buf, pos);
                pos = pos + str_len;
            } else if (i_byte_value_type === 5) {

            } else if (i_byte_value_type === BOOL_TRUE) {
                //arr_items.push(true);
            } else if (i_byte_value_type === BOOL_FALSE) {
                //arr_items.push(false);
            } else if (i_byte_value_type === NULL) {
                //arr_items.push(null);
            } else if (i_byte_value_type === BUFFER) {
                [buf_len, pos] = xas2.read(buf, pos);
                //var buf2 = Buffer.alloc(buf_len);
                buf.copy(buf2, 0, pos, pos + buf_len);
                arr_items.push(buf2);
            } else if (i_byte_value_type === ARRAY) {
                [buf_len, pos] = xas2.read(buf, pos);
                pos = pos + buf_len;
            } else if (i_byte_value_type === OBJECT) {
                let pos_start = pos;
                [buf_len, pos] = xas2.read(buf, pos);
                let read_end = pos_start + buf_len;
                //let obj = {};

                let k_l, v_l, buf_k, buf_v, k, v;

                let read_complete = false;

                while (!read_complete) {
                    [k_l, pos] = xas2.read(buf, pos);
                    //console.log('k_l', k_l);
                    buf_k = Buffer.alloc(k_l);
                    //buf.copy(buf_k, 0, pos, pos + buf_len);
                    pos = pos + k_l;
                    //k = buf_k.toString();
                    [v_l, pos] = xas2.read(buf, pos);
                    //console.log('v_l', v_l);
                    //buf_v = Buffer.alloc(v_l);
                    //buf.copy(buf_v, 0, pos, pos + buf_len);
                    pos = pos + v_l;
                    //v = decode_buffer(buf_v)[0];
                    //obj[k] = v;
                    if (pos >= read_end) read_complete = true;
                }
                //arr_items.push(obj);
            } else if (i_byte_value_type === COMPRESSED_BUFFER) {
                [compression_type, pos] = xas2.read(buf, pos);
                [compressed_length, pos] = xas2.read(buf, pos);
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
                //throw 'stop';
                throw 'Unexpected i_byte_value_type', i_byte_value_type;
            }

        }


        if (pos >= l) complete = true;
    }

    // also want to return the c_idx
    //  but that changes the API.
    //  seems important to return that here.

    //console.log('[arr_items, c_idx]', [arr_items, c_idx]);

    return [arr_items, c_idx];





}

var decode_buffer = Binary_Encoding.decode_buffer = function (buf, num_xas2_prefixes = 0, starting_pos = 0) {

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


    var arr_items = [];
    var i_prefix;
    var pos = starting_pos;

    //console.log('decode_buffer', buf);
    //console.log('decode_buffer l', buf.length);

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

    var i_byte_value_type;
    var complete = false;

    var buf_val, val;
    var i_res, num_res, str_len, str_res, arr_len, arr_res, buf_len;
    var compression_type, compressed_length, buf_uncomp;

    //console.log('pos', pos);
    //if (pos >= l - 1) complete = true;
    if (pos >= l) complete = true;


    //If returning just one result, then don't put it in an array?


    while (!complete) {
        i_byte_value_type = buf.readUInt8(pos++);
        //console.log('** i_byte_value_type', i_byte_value_type);
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

            //console.log('i_byte_value_type === BUFFER');

            [buf_len, pos] = xas2.read(buf, pos);
            // It's length encoded in the buffer.
            //console.log('BUFFER buf_len', buf_len);

            var buf2 = Buffer.alloc(buf_len);
            buf.copy(buf2, 0, pos, pos + buf_len);

            //console.trace();


            //throw 'stop';
            arr_items.push(buf2);
            pos = pos + buf_len;
        } else if (i_byte_value_type === ARRAY) {
            //console.log('reading array');


            [buf_len, pos] = xas2.read(buf, pos);


            var buf_arr = Buffer.alloc(buf_len);
            buf.copy(buf_arr, 0, pos, pos + buf_len);

            var decoded = Binary_Encoding.decode_buffer(buf_arr);
            arr_items.push(decoded);
            pos = pos + buf_len;
        } else if (i_byte_value_type === OBJECT) {
            //console.log('reading array');

            let pos_start = pos;


            // Read the full length of the object in bytes.
            [buf_len, pos] = xas2.read(buf, pos);
            //console.log('buf_len', buf_len);

            let read_end = pos_start + buf_len;
            //var buf_obj = Buffer.alloc(buf_len);



            //buf.copy(buf_obj, 0, pos, pos + buf_len);
            //console.log('buf_obj', buf_obj);

            // 

            let obj = {};

            let k_l, v_l, buf_k, buf_v, k, v;

            let read_complete = false;

            while (!read_complete) {
                [k_l, pos] = xas2.read(buf, pos);
                //console.log('k_l', k_l);
                buf_k = Buffer.alloc(k_l);
                buf.copy(buf_k, 0, pos, pos + k_l);
                pos = pos + k_l;

                k = buf_k.toString();

                [v_l, pos] = xas2.read(buf, pos);
                //console.log('v_l', v_l);
                buf_v = Buffer.alloc(v_l);

                buf.copy(buf_v, 0, pos, pos + v_l);
                pos = pos + v_l;

                v = decode_buffer(buf_v)[0];
                //console.log('v', v);



                //console.log('buf_k', buf_k);
                //console.log('buf_v', buf_v);

                obj[k] = v;

                if (pos >= read_end) read_complete = true;

                // Then copy the buffer for the key.
                //  Read string from buffer?



            }

            //var decoded = Binary_Encoding.decode_buffer(buf_obj);


            //console.log('obj', obj);
            //throw 'stop';
            arr_items.push(obj);
            //pos = pos + buf_len;
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

            // Don't want tracing now it's used for validation.
            //  Maybe a different validation procedure would be better.

            //console.trace();
            //throw 'stop';
            throw 'Unexpected i_byte_value_type', i_byte_value_type;
        }
        if (pos >= l) complete = true;
    }

    return arr_items;

    //if ()

}

let count_encoded_items = (buf, pos = 0) => {
    let c = 0,
        //pos = 0,
        l = buf.length,
        complete = false;
    if (pos >= l) complete = true;

    //console.log('buf', buf);


    while (!complete) {
        i_byte_value_type = buf.readUInt8(pos++);
        // Could have BOOL_TRUE and BOOL_FALSE as separate items.

        // 0 - xas2 number
        // 1 - 64 bit BE float
        // 2 - unix time in ms           t
        // 3 - unix time range in ms     [t, t]
        // 4 - string                    [xas2(l), str]  'utf8'
        // 5 - indexed xas2 number, representing a string
        // 6 - bool, 1 byte

        if (i_byte_value_type === XAS2) {
            [i_res, pos] = xas2.skip(buf, pos);
        } else if (i_byte_value_type === DOUBLEBE) {
            pos = pos + 8;
        } else if (i_byte_value_type === 2) {

        } else if (i_byte_value_type === 3) {

        } else if (i_byte_value_type === STRING) {
            [str_len, pos] = xas2.read(buf, pos);
            pos = pos + str_len;
        } else if (i_byte_value_type === 5) {

        } else if (i_byte_value_type === BOOL_TRUE) { } else if (i_byte_value_type === BOOL_FALSE) { } else if (i_byte_value_type === NULL) { } else if (i_byte_value_type === BUFFER) {
            // No, does not read 

            //[buf_len, pos] = xas2.read(buf, pos);
            // There is no buf len for these I think.
            [buf_len, pos] = xas2.read(buf, pos);
            pos = pos + buf_len;

            //buf.copy(buf2, 0, pos, pos + buf_len);

            //arr_items.push(buf2);
        } else if (i_byte_value_type === ARRAY) {
            [buf_len, pos] = xas2.read(buf, pos);
            pos = pos + buf_len;
        } else if (i_byte_value_type === OBJECT) {
            [buf_len, pos] = xas2.read(buf, pos);
            pos = pos + buf_len;
        } else if (i_byte_value_type === COMPRESSED_BUFFER) {
            // Have the full length first, would be a useful convention.

            // CHANGE COMPRESSED_BUFFER elsewhere

            [compressed_length, pos] = xas2.read(buf, pos);
            [compression_type, pos] = xas2.read(buf, pos);



            pos = pos + compressed_length;
        } else {
            console.log('buf', buf);
            console.trace();
            //throw 'stop';
            throw 'Unexpected i_byte_value_type', i_byte_value_type;
        }

        c++;


        if (pos >= l) complete = true;
    }

    return c;


}


let remove_kp = buf => {
    let pos = 0,
        x;

    [x, pos] = xas2.skip(buf, pos);
    let res = Buffer.alloc(buf.length - pos);
    buf.copy(res, 0, pos);
    return res;

}

let array_join_encoded_buffers = (arr_bufs) => {

    // Have an array of buffers, but they are not specifically encoded as an array.
    //  

    // No, say this is an array at the start.
    //  Don't encode that each item is an array?

    // Or make another function that works differently.


    // This function takes each of the buffers with no type enoding, turns it into a single buffer.

    // Fixes this to do what I expect.

    let bufs_res = [];
    let l = 0;
    each(arr_bufs, buf_item => {
        //bufs_res.push(Buffer.concat([xas2(ARRAY).buffer, xas2(buf_item.length).buffer, buf_item]));
        bufs_res.push(buf_item);
        l = l + buf_item.length;
    });

    //console.log('array_join_encoded_buffers bufs_res', bufs_res);

    return Buffer.concat([xas2(ARRAY).buffer, xas2(l).buffer, Buffer.concat(bufs_res)]);


}


// encode buffers as array buffer (of buffers)
//  Like above, but will encode each of those items as arrays.



// Will wind up using a more functional style for manipulating these buffers.


let remove_bytes_from_start_of_buffers = (arr_bufs, n) => {
    let l = arr_bufs.length;
    let res = new Array(l);
    for (let c = 0; c < l; c++) {

        res[c] = Buffer.alloc(arr_bufs[c].length - n);
        arr_bufs[c].copy(res[c], 0, n);
        //res.push(buf);
    }
    return res;
}

let add_buffer_to_start_of_buffers = (buf, arr_bufs) => {
    let l = arr_bufs.length,
        l_buf = buf.length;
    let res = new Array(l);
    for (let c = 0; c < l; c++) {
        res[c] = Buffer.concat([buf, arr_bufs[c]]);
    }
    return res;
}

let encode_buffers_as_buffers = (arr_bufs) => {
    let l = arr_bufs.length;
    let res = new Array(l);
    for (let c = 0; c < l; c++) {
        res[c] = encode_to_buffer([arr_bufs[c]]);
    }
    //console.log('encode_buffers_as_buffers res', res);
    return res;
}



// array_encoded_buffers

let encode_buffers_as_array_buffer = (arr_bufs) => {
    return array_join_encoded_buffers(encode_buffers_as_buffers(arr_bufs));
}

// encode buffer as array buffer
//  single buffer, contains items

let encode_buffer_as_array_buffer = (buf) => {
    return Buffer.concat([xas2(ARRAY).buffer, xas2(buf.length).buffer, buf]);
}

// Not sure how useful this will be
let encode_to_marked_buffer = (arr) => {
    return encode_to_buffer(encode_to_buffer(arr)[0]);
}


// Does not handle KPs, it's not for that kind of data.
//  Written to handle unpaging of binary data to separated binary data.
let split_encoded_buffer = (buf, pos = 0) => {
    let arr_buf_res = [];
    var l = buf.length;
    var i_byte_value_type, buffer_length;
    var complete = false;

    if (pos >= l) complete = true;




    // Skip necessary kps.



    // Skips decoding of items not in the right idx.

    let buf_item, buf_xas2_item;

    while (!complete) {
        i_byte_value_type = buf.readUInt8(pos++);
        //console.log('1) i_byte_value_type', i_byte_value_type);
        if (i_byte_value_type === XAS2) {
            [buf_xas2_item, pos] = xas2.read_buffer(buf, pos);
            buf_item = Buffer.concat([xas2(0).buffer, buf_xas2_item]);
        } else if (i_byte_value_type === DOUBLEBE) {
            buf_item = Buffer.alloc(9);
            buf_item.writeUInt8(i_byte_value_type, 0);
            buf.copy(buf_item, 1, pos, pos + 8);
            pos = pos + 8;
        } else if (i_byte_value_type === STRING || i_byte_value_type === BUFFER || i_byte_value_type === ARRAY || i_byte_value_type === OBJECT) {
            // xas2 read return the number of characters read too?
            let orig_pos = pos;
            [len, pos, xas2_buffer_length] = xas2.read(buf, pos);
            xas2_buffer_length = pos - orig_pos;
            buf_item = Buffer.alloc(1 + xas2_buffer_length + len);
            buf.copy(buf_item, 0, orig_pos - 1, orig_pos + len + xas2_buffer_length + 1);
            pos = pos + len;
        } else if (i_byte_value_type === BOOL_TRUE || i_byte_value_type === BOOL_FALSE || i_byte_value_type === NULL) {
            //arr_items.push(true);
            buf_item = Buffer.alloc(1);
            buf_item.writeUInt8(i_byte_value_type, 0);
        } else {
            console.log('i_byte_value_type', i_byte_value_type);
            console.trace();
            throw 'stop';
        }
        arr_buf_res.push(buf_item);
        if (pos >= l) complete = true;
    }
    //console.log('arr_buf_res', arr_buf_res);
    return arr_buf_res;
}

// Not sure about this now.
let split_array_encoded_buffer = (buf) => {
    let res = [],
        length;

    // the array encoded buffer will start with xas2(ARRAY)

    let [encoding_id, pos] = xas2.read(buf, 0);
    console.log('encoding_id', encoding_id);
    [length, pos] = xas2.read(buf, pos);
    console.log('length', length);

    if (encoding_id === ARRAY) {
        console.log('splitting array encoded buffer');

        return split_encoded_buffer(buf, pos);



    } else {
        throw 'split_array_encoded_buffer expects array encoded buffer, read encoding_id ' + encoding_id;
    }


    // look through this buf, copying the content bufs.

    //return res;
}



// add buffer to start of buffer
// multi_xas2_buffer()

// Could have decode_item function if fishing it out of an array is a problem.
//  Because of the whole row and record encoding system, we need to decode into an array when not reading it sequentially.
//  Decoding iterator would be useful.

Binary_Encoding.buffer_select_from_buffer = buffer_select_from_buffer;
Binary_Encoding.decode_buffer_select_by_index = decode_buffer_select_by_index;

Binary_Encoding.decode = decode_buffer;
Binary_Encoding.encode = flexi_encode_item;
Binary_Encoding.flexi_encode = flexi_encode_item;

Binary_Encoding.join_buffer_pair = join_buffer_pair;
Binary_Encoding.split_length_item_encoded_buffer_to_kv = split_length_item_encoded_buffer_to_kv;
Binary_Encoding.split_length_item_encoded_buffer = split_length_item_encoded_buffer;
Binary_Encoding.decode_first_value_xas2_from_buffer = decode_first_value_xas2_from_buffer;
Binary_Encoding.encode_to_buffer = encode_to_buffer;
Binary_Encoding.encode_to_buffer_use_kps = encode_to_buffer_use_kps;
Binary_Encoding.full_decode = full_decode;
Binary_Encoding.compress_buffer_zlib9 = compress_buffer_zlib9;

Binary_Encoding.remove_kp = remove_kp;
Binary_Encoding.xas2_sequence_to_array_buffer = xas2_sequence_to_array_buffer;
Binary_Encoding.array_join_encoded_buffers = array_join_encoded_buffers;
Binary_Encoding.remove_bytes_from_start_of_buffers = remove_bytes_from_start_of_buffers;
Binary_Encoding.add_buffer_to_start_of_buffers = add_buffer_to_start_of_buffers;
Binary_Encoding.encode_buffers_as_buffers = encode_buffers_as_buffers;
Binary_Encoding.encode_buffer_as_array_buffer = encode_buffer_as_array_buffer;
Binary_Encoding.encode_buffers_as_array_buffer = encode_buffers_as_array_buffer;

// Encoding where we 

Binary_Encoding.split_encoded_buffer = split_encoded_buffer;
Binary_Encoding.split_array_encoded_buffer = split_array_encoded_buffer;
Binary_Encoding.encode_to_marked_buffer = encode_to_marked_buffer;
Binary_Encoding.count_encoded_items = count_encoded_items;
Binary_Encoding.get_value_at = get_value_at;
Binary_Encoding.get_pos = get_pos;
Binary_Encoding.read_value = read_value;



module.exports = Binary_Encoding;

if (require.main === module) {
    let test_encode_decode = (item) => {
        let b = Binary_Encoding.flexi_encode_item(item);
        //console.log('b', b);

        // Incorporate fishing it out of item 0.

        let a2 = Binary_Encoding.decode(b)[0];
        console.log('item', item);
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

    /*
    test_encode_decode([]);
    test_encode_decode([
        [],
        []
    ]);
    */

    let test_obj = (obj) => {
        obj = obj || {
            'str_key_1': [],
            'str_key_2': [1, 2, 3],
            'str_key_3': {
                'hello': 'world'
            }
        }
        let b = Binary_Encoding.flexi_encode_item(obj);
        console.log('b', b);

        let d = Binary_Encoding.decode(b)[0];

        console.log('d', d);

        let pass = deep_equal(obj, d);
        console.log('pass', pass);

    }
    //test_obj({
    //    'a': 'b'
    //});
    //test_obj();

    test_obj();
    //test_encode_decode(0);

    //test_encode_decode(a1);
    //test_encode_decode('James');
    //test_encode_decode(['James']);
    //test_encode_decode(['James', 'Vickers']);


    // a1 [ [ 1, 2, 3 ], [ 4, 5, 6 ] ]
    //a2 [ [ [ 1, 2, 3 ], [ 4, 5, 6 ] ] ]




} else {
    //console.log('required as a module');
}