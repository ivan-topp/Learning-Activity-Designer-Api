const Category = require('./Category');
const Design = require('./Design');
const { DesignRoom } = require("./DesignRoom");

class DesignRoomList {
    constructor() {
        this.rooms = [];
    }

    async addDesignRoom( designId ) {
        try {
            const design = await Design.findById( designId ).populate({ path: 'metadata.category', model: Category });
            const newDesignRoom = new DesignRoom( design );
            this.rooms.push(newDesignRoom);
            return newDesignRoom;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    getDesignRoomById( id ) {
        try {
            const roomFiltered = this.rooms.filter( (designRoom) => designRoom.id == id);
            return roomFiltered.length > 0 ? roomFiltered[0] : null;
        } catch (error) {
            return false;
        }
    }

    removeDesignRoom( id ) {
        this.rooms = this.rooms.filter(room => room.design._id != id);
    }

}

module.exports = {
    DesignRoomList
}