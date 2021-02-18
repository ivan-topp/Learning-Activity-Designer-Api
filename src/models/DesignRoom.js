class DesignRoom {
    constructor( design ) {
        this.id = design._id.toString();
        this.users = [];
        this.design = design;
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

}

module.exports = {
    DesignRoom
}