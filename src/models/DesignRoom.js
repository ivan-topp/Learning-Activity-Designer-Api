const Design = require("./Design");

class DesignRoom {
    constructor( design ) {
        this.id = design._id.toString();
        this.users = [];
        this.design = design;
    }

    static async hasEditor(designId, uid){
        try {
            const design = await Design.findById( designId );
            if(!design) return false;
            for (const privilege of design.privileges) if(privilege.user == uid && privilege.type === 0) return true;
            return false;
        } catch (error) {
            console.log(error);
            return false;
        }
    }

    addUser( user ) {
        this.users.push(user);
        return this.users;
    }

    getUser( id ) {
        let user = this.users.filter(user => user.uid  == id)[0];
        return user;
    }

    getUsers() {
        return this.users;
    }

    removeUser( id ) {
        let removedUser = this.getUser( id );
        this.users = this.users.filter(user => user.socketId != id);
        return removedUser;
    }

    editDesign(newDesign) {
        this.design = newDesign;
    }

}

module.exports = {
    DesignRoom
}