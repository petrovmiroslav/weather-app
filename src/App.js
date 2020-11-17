import React from 'react';
import './App.css';

class WeatherApp extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      loading: false,
      scale: 'C',
      location: '',
      temp: '',
      sky: '',
      icon: '',
      feels_like: '',
      humidity: '',
      pressure: '',
      sunrise: '',
      sunset: '',
      error: 0
    };

    this.getPosition = this.getPosition.bind(this);
    this.getPositionErrorHandler = this.getPositionErrorHandler.bind(this);
    this.fetchWeather = this.fetchWeather.bind(this);
    this.tempScaleChange = this.tempScaleChange.bind(this);
  }

  getPosition () {
    if (!navigator.geolocation) return this.setError(2);
    this.setState({
      loading: true,
      error: 0
    });
    navigator.geolocation.getCurrentPosition(
      this.fetchWeather, 
      this.getPositionErrorHandler);
  }

  setError (errorCode) {
    this.setState({
      loading: false,
      error: errorCode
    });
  }
  getPositionErrorHandler (err) {
    this.setError(1);
  }

  fetchWeather (pos) {
    this.setState({
      lat: Math.round(pos.coords.latitude),
      lon: Math.round(pos.coords.longitude)
    });
    fetch('https://fcc-weather-api.glitch.me/api/current?lon='
          + pos.coords.longitude + '&lat='
          + pos.coords.latitude)
    .then(r => r.json())
    .then(this.fetchResultHandler.bind(this), 
          this.fetchErrorHandler.bind(this));
  }

  fetchResultHandler (result) {
    if (Math.round(result.coord.lat) !== this.state.lat 
      || Math.round(result.coord.lon) !== this.state.lon) 
      return this.setError(2);

    this.setState({
      loading: false,
      location: (result.name && result.sys.country 
                && result.name + ', ' + result.sys.country) || '',
      temp: result.main.temp || result.main.temp === 0 
              ? Math.round(result.main.temp) : '',
      feels_like: result.main.feels_like 
                  || result.main.feels_like === 0 
                    ? Math.round(result.main.feels_like) : '',
      sky: result.weather[0].main || '',
      icon: result.weather[0].icon || false,
      humidity: result.main.humidity || result.main.humidity === 0 
                  ? result.main.humidity + ' %' : '',
      pressure: result.main.pressure || result.main.pressure === 0 
                  ? result.main.pressure + ' mbar' : '',
      sunrise: result.sys.sunrise ? formatDate(result.sys.sunrise) : '',
      sunset: result.sys.sunset ? formatDate(result.sys.sunset) : '',
      error: 0
    });

    function formatDate (unix) {
      let date = new Date(unix * 1000),
      h = '0' + date.getHours(),
      m = '0' + date.getMinutes();
      return h.substr(-2) + ':' + m.substr(-2);
    }
  }

  fetchErrorHandler (err) {
    this.setError(2);
  }

  tempScaleChange () {
    if (this.state.temp === '' || isNaN(this.state.temp)) return;
    let t,f,s;
    if (this.state.scale === 'C') {
      t = Math.round(this.state.temp * 1.8 + 32);
      f = (this.state.feels_like === '' 
          || isNaN(this.state.feels_like)) 
            ? '' : Math.round(this.state.feels_like * 1.8 + 32);
      s = 'F';
    } else {
      t = Math.round((this.state.temp - 32) / 1.8);
      f = (this.state.feels_like === '' 
          || isNaN(this.state.feels_like)) 
            ? '' : Math.round((this.state.feels_like - 32) / 1.8);
      s = 'C';
    }
    this.setState({
      temp: t,
      feels_like: f,
      scale: s
    });
  }
  
  componentDidMount () {
    this.getPosition();
  }

  render () {
    return (
      <div className='weatherApp'>
        <BG sky={this.state.sky}/>
        <Header icon={this.state.icon} loading={this.state.loading}/>
        {this.state.error 
          ? <ErrorMessage 
              error={this.state.error}
              loading={this.state.loading}
              getPosition={this.getPosition}/>
          : <Display 
            location={this.state.location}
            temp={this.state.temp}
            sky={this.state.sky}
            scale={this.state.scale}
            tempScaleChange={this.tempScaleChange}
            feels_like={this.state.feels_like}
            humidity={this.state.humidity}
            pressure={this.state.pressure}
            sunrise={this.state.sunrise}
            sunset={this.state.sunset}/>}
        <Footer/>
      </div>
    );
  }
}

function BG (props) {
  const c = ['','','',''];
  switch (props.sky) {
    case 'Snow':
      c[0] = ' bg__layer_ON';
      break;
    case 'Rain':
      c[1] = ' bg__layer_ON';
      break;
    case 'Clouds':
      c[2] = ' bg__layer_ON';
      break;
    case 'Clear':
      c[3] = ' bg__layer_ON';
      break;
    default:
  }
  return (
    <div className='bg'>
      <div className={'bg__layer bg__layer_snow' + c[0]}/>
      <div className={'bg__layer bg__layer_rain' + c[1]}/>
      <div className={'bg__layer bg__layer_clouds' + c[2]}/>
      <div className={'bg__layer bg__layer_clear' + c[3]}/>
    </div>
  );
}

function Header (props) {
  return (
    <header className='header'>
      <div className='header__gap'/>
      <h1 className='header__h1'>Free Weather App</h1>
      {props.loading 
        ? <p className='header__loading'>Loading...</p>
        : <Icon icon={props.icon}/>}
      <div className='header__gap'/>
    </header>
  );
}

function Icon (props) {
  return (
    <div className='header__icon'>
      {props.icon && <img src={props.icon} className='header__img' alt='Sky Icon'/>}
    </div>
  );
}

function ErrorMessage (props) {
  const messages = ['Denied access to geolocation. Please allow the page to access your location.','Information is temporarily unavailable. Please '];
  return (
    <section className='errorMessage'>
      <p className='errorMessage__text'>
      {messages[props.error - 1]}
      {props.error === 2 && <button 
        className='errorMessage__button'
        onClick={props.getPosition}>try again.</button>}
      </p>
    </section>
  );
}

function Display (props) {
  return (
    <section className='display'>
      <Section type='location' value={props.location}/>
      <Section 
        type='temperature' 
        value={props.temp + '\u00B0'} 
        scale={props.scale} 
        tempScaleChange={props.tempScaleChange}/>
      <Section type='sky' value={props.sky}/>
      <Section 
        type='feelsLike' 
        value={props.feels_like + '\u00B0'} 
        scale={props.scale} 
        tempScaleChange={props.tempScaleChange}/>
      <Section type='humidity' value={props.humidity}/>
      <Section type='pressure' value={props.pressure}/>
      <Section type='sunrise' value={props.sunrise}/>
      <Section type='sunset' value={props.sunset}/>
    </section>
  );
}

function Section (props) {
  return (
    <div className={'section ' + props.type}>
      <div className='section__gap'/>
      <h2 className='section__header'>
        {props.type === 'feelsLike' 
          ? 'FEELS LIKE'
          : props.type.toUpperCase()}</h2>
      <p className='section__value'>{props.value}</p>
      {props.tempScaleChange && 
        <button className='section__button'
          onClick={props.tempScaleChange}>{props.scale}</button>
        }
    </div>
  );
}

function Footer () {
  return (
    <footer>
      <a className="footer__link" href="https://www.instagram.com/miroslavpetrov_/" target="_blank" rel="noopener noreferrer">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style={{verticalAlign: "middle", width: 16}}>
          <path d="M256 49c67 0 75 1 102 2 24 1 38 5 47 9a78 78 0 0129 18 78 78 0 0118 29c4 9 8 23 9 47 1 27 2 35 2 102l-2 102c-1 24-5 38-9 47a83 83 0 01-47 47c-9 4-23 8-47 9-27 1-35 2-102 2l-102-2c-24-1-38-5-47-9a78 78 0 01-29-18 78 78 0 01-18-29c-4-9-8-23-9-47-1-27-2-35-2-102l2-102c1-24 5-38 9-47a78 78 0 0118-29 78 78 0 0129-18c9-4 23-8 47-9 27-1 35-2 102-2m0-45c-68 0-77 0-104 2-27 1-45 5-61 11a123 123 0 00-45 29 123 123 0 00-29 45c-6 16-10 34-11 61-2 27-2 36-2 104l2 104c1 27 5 45 11 61a123 123 0 0029 45 123 123 0 0045 29c16 6 34 10 61 11a1796 1796 0 00208 0c27-1 45-5 61-11a129 129 0 0074-74c6-16 10-34 11-61 2-27 2-36 2-104l-2-104c-1-27-5-45-11-61a123 123 0 00-29-45 123 123 0 00-45-29c-16-6-34-10-61-11-27-2-36-2-104-2z"></path>
          <path d="M256 127a129 129 0 10129 129 129 129 0 00-129-129zm0 213a84 84 0 1184-84 84 84 0 01-84 84z"></path>
          <circle cx="390.5" cy="121.5" r="30.2"></circle>
        </svg> Miroslav Petrov</a>
    </footer>
  );
}

function App() {
  return (
    <WeatherApp/>
  );
}
export default App;
