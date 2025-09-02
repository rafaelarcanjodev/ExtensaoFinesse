const User = {
  _username: "",
  _agentId: "",
  _password: "",
  _standartTimer: "",
  _pauseTimer: "",
  _connectionStatus: "",
  _reasonDescription: "",
  _reasonCode: "",

  get username() {
    return this._username;
  },

  set username(newUsername) {
    if (typeof newUsername === "string" && newUsername.length > 0) {
      this._username = newUsername; // Corrigido de _nome para _username
    } else {
      log("O nome de usuário deve ser uma string não vazia.");
    }
  },

  get agentId() {
    return this._agentId;
  },

  set agentId(newAgentId) {
    if (typeof newAgentId === "string" && newAgentId.length > 0) {
      this._agentId = newAgentId;
    } else {
      log("O ID do agente deve ser uma string não vazia."); // Mensagem de erro corrigida
    }
  },

  get password() {
    return this._password;
  },

  set password(newPassword) {
    if (typeof newPassword === "string" && newPassword.length > 0) {
      this._password = newPassword;
    } else {
      log("A senha deve ser uma string não vazia.");
    }
  },

  get standartTimer() {
    return this._standartTimer;
  },

  set standartTimer(newTimer) {
    if (newTimer !== null && newTimer !== undefined) {
      this._standartTimer = newTimer;
    } else {
      log("O standartTimer não pode ser nulo ou indefinido.");
    }
  },

  get pauseTimer() {
    return this._pauseTimer;
  },

  set pauseTimer(newTimer) {
    if (newTimer !== null && newTimer !== undefined) {
      this._pauseTimer = newTimer;
    } else {
      log("O pauseTimer não pode ser nulo ou indefinido.");
    }
  },

  get connectionStatus() {
    return this._connectionStatus;
  },

  set connectionStatus(newStatus) {
    if (typeof newStatus === "string" && newStatus.length > 0) {
      this._connectionStatus = newStatus;
    } else {
      log("O status da conexão deve ser uma string não vazia.");
    }
  },

  get reasonDescription() {
    return this._reasonDescription;
  },

  set reasonDescription(newDescription) {
    if (typeof newDescription === "string" && newDescription.length > 0) {
      this._reasonDescription = newDescription;
    } else {
      log("A descrição do motivo deve ser uma string não vazia.");
    }
  },

  get reasonCode() {
    return this._reasonCode;
  },

  set reasonCode(newCode) {
    if (newCode !== null && newCode !== undefined) {
      this._reasonCode = newCode;
    } else {
      log("O código do motivo não pode ser nulo ou indefinido.");
    }
  },
};
