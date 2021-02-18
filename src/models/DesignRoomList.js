const Design = require('./Design');
const { DesignRoom } = require("./DesignRoom");

class DesignRoomList {
    constructor() {
        this.rooms = [];
    }

    async addDesignRoom( designId ) {
        try {
            const design = await Design.findById( designId );
            const newDesignRoom = new DesignRoom( design );
            this.rooms.push(newDesignRoom);
            return newDesignRoom;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    getDesignRoomById( id ) {
        const roomFiltered = this.rooms.filter( (designRoom) => designRoom.id == id);
        return roomFiltered.length > 0 ? roomFiltered[0] : null;
    }

    removeDesignRoom( id ) {
        this.rooms = this.rooms.filter(room => room.design._id != id);
    }

}

module.exports = {
    DesignRoomList
}