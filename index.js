switch (document.location.pathname) {
  case '/charts/first.html':
    buildChart(0);
    break;
  case '/charts/second.html':
    buildChart(1);
    break;
  case '/charts/third.html':
    buildChart(2);
    break;
  case '/charts/fouth.html':
    buildChart(3);
    break;
  case '/charts/fifth.html':
    buildChart(4);
    break;
}

function buildChart(num) {
  const body = document.body;
  const options = { elem: body }
  const chart = new Chart(options);
  chart.build(data[num]);
}