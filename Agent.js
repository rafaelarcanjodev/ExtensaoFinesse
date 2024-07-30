class Agent {
    constructor(finesse) {
      this.nome = finesse.firstName + " " + finesse.lastName;
    }

    name() {
      console.log(`Olá, meu nome é ${this.nome}`);
    }
}