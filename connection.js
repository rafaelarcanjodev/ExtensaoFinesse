async function connection(username, password, agentId) {
  const url = 'https://sncfinesse1.totvs.com.br:8445/finesse/api/User/' + agentId + '/';
  const credentials = btoa(`${username}:${password}`);

  // Fetch Configuration
  const controller = new AbortController();
  const signal = controller.signal;
  const timeout = 5000; // 5 seconds
  const timeoutId = setTimeout(() => controller.abort(), timeout); // start timer

  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${credentials}`
    },
    signal
  };

  try {
    const response = await fetch(url, options);

    // Clear timeout
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error('Erro na requisição: ' + response.statusText);
    }

    const data = await response.text();
    const finesse = xmlToJson(data);
    return finesse;

  } catch (error) {
    if (error.name === 'AbortError') {
      alert('A requisição foi cancelada por exceder o tempo limite.');
    } 
    
    throw error;
  }
}