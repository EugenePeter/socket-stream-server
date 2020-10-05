const fs = require("fs");
const path = require("path");
const os = require("os");
const ss = require("socket.io-stream");

const { getFileSizeInBytes, createUploadsFolder } = require("../utils");

module.exports = (io) => {
    io.on("connection", (socket) => {
        console.log(`\nNew Connection: ${socket.id}`);

        /* Fetch File Names */
        socket.on("fetch_files", () => {
            fs.readdir(path.join("../uploads"), (err, files) => {
                if (err) console.log(err);

                // convert array to array of objects
                const convertToArrOfObj = (reducer, item) => {
                    return [
                        ...reducer,
                        {
                            name: item,
                            path: `http://${
                                os.networkInterfaces().wlp2s0[0].address
                            }:${process.env.PORT}/${item}`,
                        },
                    ];
                };

                const filenames = files.reduce(convertToArrOfObj, []);

                // console.log("Filenames ArrOfObj:", filenames);
                socket.emit("filenames", filenames);
            });
        });

        // TESTING PA NI FOR CHUNKS
        // socket.on("file_upload", ({ value, length }) => {
        //   // const chunk_readstream = fs.createReadStream(chunk)
        //   // const chunk_writestream = fs.createWriteStream(
        //   //   `../metadata/${Date.now()}.metadata`
        //   // );
        //   const chunk_readstream = fs.writeFile(
        //     `../metadata/${Date.now()}.metadata`,
        //     chunk,
        //     () => {}
        //   );

        //   // fs.readdir(path.join("../metadata"), (err, files) => {
        //   //   console.log(`metdata:`, files);
        //   // });
        // });

        let totaltime;
        let start;
        let end;
        // const buffConcat = []
        let conct;
        //upload file
        socket.on("check_time", (datatime) => {
            start = datatime;
            //upload file
            socket.on("file_upload", async (data) => {
                const { value, length, file } = data;
                // console.log("from client data", data);
                // console.log("valueeeee", value);
                // const test = decodeBase64Image(data)
                if (data) {
                    // buffConcat.push(data)
                    // conct = Buffer.concat(buffConcat)
                    end = Date.now();
                    totaltime = (end - datatime) / 1000;
                    console.log("total time", totaltime);

                    await createUploadsFolder();

                    let size = 0;

                    const filename = `../uploads/${file.name}`;
                    const writeStream = fs.createWriteStream(filename);
                    console.log("valueeeee", value);
                    // value.pipe(writeStream);
                    // fs.createWriteStream(value).pipe(filename);
                    // console.log(conct.toString('base64'))
                }
            });
        });

        /* Upload Stream */
        ss(socket).on("upload_stream", async (stream, file) => {
            await createUploadsFolder();

            let size = 0;

            const filename = `../uploads/${file.name}`;
            stream.pipe(fs.createWriteStream(filename));

            stream.on("data", (chunk) => {
                size += chunk.length;
                const loader = Math.floor((size / file.size) * 100) + "%";

                process.stdout.write(
                    `\rUploading (${loader}) | Size: ${file.size} | Uploader: ${file.user} | File: ${file.name} | Socket: ${socket.id} `
                );

                socket.emit("loader", loader);
            });

            stream.on("error", () => {
                console.log("\nUpload cancelled by client!");
            });

            stream.on("end", () => {
                console.log("\nUpload success!");
                socket.broadcast.emit("new_file", { name: file.name });
            });
        });

        /* Download Stream */
        socket.on("request_file", ({ file_name }) => {
            const stream = ss.createStream();

            const file_download = `../uploads/${file_name}`;

            ss(socket).emit("get_file", stream, {
                name: file_name,
                size: getFileSizeInBytes(file_download),
                path: `http://${os.networkInterfaces().wlp2s0[0].address}:${
                    process.env.PORT
                }/${file_name}`,
            });
            fs.createReadStream(file_download).pipe(stream);

            stream.on("error", () => {
                console.log("\nDownload cancelled by client!");
            });

            stream.on("finish", () => {
                console.log("\nDownload success!");
                stream.end();
            });

            socket.on("client_download", (data) => {
                process.stdout.write(
                    `\rDownloading (${data}) | Size: ${getFileSizeInBytes(
                        file_download
                    )} | File: ${file_name} | Socket: ${socket.id}`
                );
            });
        });

        socket.on("disconnect", () => {
            console.log(`\nDC | Socket:`, socket.id);
        });

        socket.on("error", (err) => {
            console.log(`\nSocket Error:`, err);
        });
    });
};
