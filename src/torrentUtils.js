const bencode = require('bencode');

async function modifyTorrent(torrentBuffer, trackerUrl) {
    try {
        // Decode the original torrent to get raw structure
        const decodedTorrent = bencode.decode(torrentBuffer);

        // Clone the info dictionary
        const newInfo = {...decodedTorrent.info};

        // This changes the info hash without affecting the actual content
        newInfo.source = Buffer.from(`${trackerUrl}`);

        // Create a new torrent structure
        const newTorrent = {
            info: newInfo,
            'announce': trackerUrl,
            'announce-list': [[trackerUrl]],
            'created by': 'Simple-Tracker',
            'creation date': Math.floor(Date.now() / 1000),
            private: 1
        };

        // Bencode the modified torrent
        return bencode.encode(newTorrent);
    } catch (error) {
        console.error('Error in modifyTorrent:', error);
        throw new Error(`Failed to modify torrent: ${error.message}`);
    }
}

module.exports = {
    modifyTorrent,
};
