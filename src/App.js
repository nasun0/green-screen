import React, { useState, useEffect } from 'react';
import logo from './images/Logo.png';
import rocket from './images/Rocket.png';
import trash from './images/TrashCan.png';
import Select from '@mui/material/Select';
import OutlinedInput from '@mui/material/OutlinedInput';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Divider from '@mui/material/Divider';
import { motion, AnimatePresence, AnimateSharedLayout } from "framer-motion";
import { Cell, PolarRadiusAxis, LineChart, Line, YAxis, PieChart, Pie, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import TextField from '@mui/material/TextField';
import companies from './assets/companies';
import './App.css';

const categories = ["Environmental", "Social", "Governance"];
const categoryColorMap = {"Environmental": "#75d8ff", "Social": "#ffd859", "Governance": "#b06bff",
  "E": "#75d8ff", "S": "#ffd859", "G": "#b06bff"};
const env_threshold = 28;
const soc_threshold = 25;
const gov_threshold = 26;
const does_fetch = true;

function setColor(p){
  if (p < 0)
    return "rgb(255, 0, 0)";
  if (p > 100)
    return "rgb(0, 255, 0)";
  var red = p<50 ? 255 : Math.round(256 - (p-50)*5.12);
  var green = p>50 ? 255 : Math.round((p)*5.12);
  return "rgb(" + red + "," + green + ",0)";
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function Backdrop(props) {
  const variance = {
    "visible": {
      opacity: 1,
    },
    "hidden": {
      opacity: 0,
    },
  };
  return (
    <AnimatePresence exitBeforeEnter>
      {props.showBackdrop && (<motion.div variances={variance} initial="hidden" animate="visible" style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3, backgroundColor: '#000000c0'
      }} onClick={() => props.leaveDetailed()}/>)}
    </AnimatePresence>
  );
}

function DetailedView(props) {
  const {width, height} = useWindowDimensions();
  const [data, setData] = useState([]);
  const color = data.length > 0 && data[0].value >= data[data.length - 1].value ? 'red' : 'green';
  const [time, setTime] = useState("1W");
  useEffect(() => {
    if (data && data.length === 0) {
      let url = 'https://finnhub.io/api/v1/stock/candle?symbol=';
      url += props.symbol;
      url += '&resolution=';
      if (time === '1W' || time === '1M')
        url += '5';
      else if (time === '3M' || time === '6M')
        url += '15';
      else
        url += '30';
      const newTime = parseInt(new Date().getTime() / 1000);
      let prevTime = newTime;
      if (time === '1W')
        prevTime -= 7 * 24 * 60 * 60;
      else if (time === '1M')
        prevTime -= 30 * 24 * 60 * 60;
      else if (time === '3M')
        prevTime -= 3 * 30 * 24 * 60 * 60;
      else if (time === '6M')
        prevTime -= 6 * 30 * 24 * 60 * 60;
      else
        prevTime -= 12 * 30 * 24 * 60 * 60;
      url += '&from=';
      url += prevTime;
      url += '&to=';
      url += newTime;
      url += '&token=c5cau7aad3ib55bb0h20';
      if (does_fetch)
        fetch(url).then(response => response.json()).then(data => setData(data["c"].map(x => ({value: x}))))
          .catch(error => console.error("fetch error, please check if symbol is correct, but rate limit can also be passed"));
    }
  }, [time, props.symbol, data]);
  const remove = props.removeStock;

  return (
    <>
      <div style={{position: 'fixed', width: 800, height: 600, left: (width - 800) / 2, top: (height - 600 - 164) / 2, display: 'flex', flexDirection: 'column', zIndex: 4}}>
        {remove && <div style={{
          position: 'absolute', right: -5, top: 15
        }} onClick={() => remove(props.symbol)}>
          <img src={trash} width="45px" alt="Trash can"/>
        </div>}
        <div style={{display: 'flex', flexDirection: 'row'}}>
          <motion.span layoutId={props.symbol + "_symbol"} style={{fontSize: 80, fontWeight: 'bold', color: '#eeeeee'}}>{props.symbol}</motion.span>
          {props.numStocks !== -1 && <span style={{marginTop: 16, marginLeft: 15}}>{props.numStocks}<br/>Shares</span>}
        </div>
        <motion.span layoutId={props.symbol + "_name"} style={{fontSize: 35, color: '#aaaaaa'}}>{props.name}</motion.span>
        <ButtonGroup variant="outlined" style={{marginTop: 40, marginLeft: 110}}>
          <Button onClick={() => {setTime("1W");setData([])}}>1W</Button>
          <Button onClick={() => {setTime("1M");setData([])}}>1M</Button>
          <Button onClick={() => {setTime("3M");setData([])}}>3M</Button>
          <Button onClick={() => {setTime("6M");setData([])}}>6M</Button>
          <Button onClick={() => {setTime("1Y");setData([])}}>1Y</Button>
        </ButtonGroup>
        <motion.div layoutId={props.symbol + "_chart"}>
          {data.length > 0 ? (
            <LineChart width={800} height={250} data={data} margin={{top: 60, right: 0, bottom: 20, left: 0}}>
              <YAxis type="number" domain={['dataMin', 'dataMax']} width={120}/>
              <Line type="monotone" dataKey="value" stroke={color} dot={false}/>
            </LineChart>
          ) : <div style={{width: 800, height: 250}} />}
        </motion.div>
        <RadarChart style={{marginLeft: 200}} outerRadius={90} width={460} height={250} data={[{type: 'Environmental', value: props.env_v}, {type: 'Social', value: props.soc_v}, {type: 'Governance', value: props.gov_v}]}>
          <PolarGrid />
          <PolarAngleAxis dataKey="type"/>
          <PolarRadiusAxis style={{display: 'none'}} angle={120} domain={[0, 33]} />
          <Radar name="Average ESG" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
        </RadarChart>
      </div>
    </>
  )
}

function SearchTagInput(props) {
  const variant = {
    atHome: {
      y: -10,
      opacity: 0,
    },
    transitionToExplore: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      }
    },
    atExplore: {
      y: 0,
      opacity: 1,
    },
    transitionToHome: {
      y: -10,
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 100,
      }
    },
  }
  return (
    <motion.div variants={variant} initial={{opacity: 0}}>
      <FormControl sx={{ m: 1, width: 400 }} style={{marginLeft: 16}}>
        <InputLabel id="select-label-id" style={{color: '#eeeeee'}}>Categories</InputLabel>
        <Select
          labelId="select-label-id"
          multiple
          value={props.searchTags}
          onChange={(event) => props.setSearchTags(typeof event.target.value === 'string' ? event.target.value.split(',') : event.target.value)}
          input={<OutlinedInput id="select-multiple-chip" label="Categories" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip key={value} label={value} style={{color: categoryColorMap[value], backgroundColor: categoryColorMap[value] + '30'}}/>
              ))}
            </Box>
          )}
        >
          {categories.map((category) => (
            <MenuItem key={category} value={category}>
              {category}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </motion.div>
  );
}

function Header(props) {
  return (
    <div style={{marginLeft: 300, marginRight: 300, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <img src={logo} alt={"logo"} width="100px" style={{
          margin: 32,
        }} onClick={() => props.changeScreen(false)} />
        {(props.state === "atHome" || props.state === "transitionToHome") && <span style={{position: 'absolute', left: 590, fontSize: 50, fontWeight: 'lighter'}}>Your Portfolio</span>}
        <SearchTagInput searchTags={props.searchTags} setSearchTags={props.setSearchTags} state={props.state}/>
        <img src={rocket} alt={"rocket"} width="100px" style={{
          margin: 32
        }} onClick={() => props.changeScreen(true)}/>
    </div>
  );
}

function getWindowDimensions() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height
  };
}

function useWindowDimensions() {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    function handleResize() {
      setWindowDimensions(getWindowDimensions());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
}

function Portfolio(props) {
  const {width} = useWindowDimensions();
  const [detailed, setDetailed] = useState("");
  const [name, setName] = useState("");
  const [env_v, setEnv_v] = useState(-1);
  const [soc_v, setSoc_v] = useState(-1);
  const [gov_v, setGov_v] = useState(-1);
  const [amount, setAmount] = useState(-1);
  function handleDetailView(symbol, name, env_v, soc_v, gov_v, amt) {
    setDetailed(symbol);
    setName(name);
    setEnv_v(env_v);
    setSoc_v(soc_v);
    setGov_v(gov_v);
    setAmount(amt);
  }
  return (
    <div style={{
      paddingLeft: 340,
      textAlign: 'left',
      color: '#eeeeee',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#222222',
      width: width - 340
    }}>
      <AnimateSharedLayout>
        {props.portfolio.map(suggestion => (
          <ExploreStock key={suggestion.symbol} symbol={suggestion.symbol} name={companies[suggestion.symbol][0]} time={"1W"} env_v={companies[suggestion.symbol][1][1]} soc_v={companies[suggestion.symbol][1][2]} gov_v={companies[suggestion.symbol][1][3]} handleDetailView={handleDetailView} numStocks={suggestion.amount} unprocessedCompanies={props.unprocessedCompanies} totalWorth={props.totalWorth} setTotalWorth={props.setTotalWorth} setUnprocessedCompanies={props.setUnprocessedCompanies}/>
        ))}
        <Backdrop showBackdrop={detailed !== ""} leaveDetailed={() => setDetailed("")}/>
        {detailed !== "" && <DetailedView symbol={detailed} name={name} env_v={env_v} soc_v={soc_v} gov_v={gov_v} removeStock={symbol => {
          let index;
          for (let idx = 0; idx < props.portfolio.length; idx++)
            if (props.portfolio[idx].symbol === symbol)
              index = idx;
          props.setPortfolio(props.portfolio.slice(0, index).concat(props.portfolio.slice(index + 1)));
          setDetailed("");
        }} numStocks={amount}/>}
        <AddStock setPortfolio={props.setPortfolio} portfolio={props.portfolio} unprocessedCompanies={props.unprocessedCompanies} setUnprocessedCompanies={props.setUnprocessedCompanies}/>
      </AnimateSharedLayout>
    </div>
  )
}

function HomeScreen() {
  const {width, height} = useWindowDimensions();
  const [totalWorth, setTotalWorth] = useState(7263);
  const [portfolio, setPortfolio] = useState([
    {symbol: "GS", amount: 1},
    {symbol: "AAPL", amount: 1},
    {symbol: "SBUX", amount: 1},
    {symbol: "NKE", amount: 1},
    {symbol: "TMUS", amount: 1},
    {symbol: "AMZN", amount: 1},
    {symbol: "FB", amount: 1},
    {symbol: "GOOGL", amount: 1},
  ]);
  const [unprocessedCompanies, setUnprocessedCompanies] = useState(new Set(
    // ["GS", "AAPL", "SBUX", "NKE", "TMUX", "AMZN", "FB", "GOOGL"]
  ));
  let pieChartData = [{value: 0, name: 'Environmental'}, {value: 0, name: 'Social'}, {value: 0, name: 'Governance'}, {value: 0, name: 'None'}];
  let radarChartData = [{type: 'Environmental', value: 0}, {type: 'Social', value: 0}, {type: 'Governance', value: 0}];
  let totalData = 0;
  for (let company of portfolio) {
    const env_v = companies[company.symbol][1][1];
    const soc_v = companies[company.symbol][1][2];
    const gov_v = companies[company.symbol][1][3];
    radarChartData[0].value += env_v;
    radarChartData[1].value += soc_v;
    radarChartData[2].value += gov_v;
    totalData++;
    if (env_v < env_threshold && soc_v < soc_threshold && gov_v < gov_threshold) {
      pieChartData[3].value++;
    } else {
      let highest = [env_v, soc_v, gov_v].sort()[2];
      if (highest === env_v)
        pieChartData[0].value++;
      else if (highest === soc_v)
        pieChartData[1].value++;
      else if (highest === gov_v)
        pieChartData[2].value++;
    }
  }
  pieChartData[0].value += 1;
  pieChartData[1].value += 1;
  pieChartData[2].value += 1;
  pieChartData[3].value += 1;
  if (totalData > 0) {
    radarChartData[0].value = parseInt(radarChartData[0].value / totalData + 0.5);
    radarChartData[1].value = parseInt(radarChartData[1].value / totalData + 0.5);
    radarChartData[2].value = parseInt(radarChartData[2].value / totalData + 0.5);
  }
  return (
    <div style={{
      textAlign: 'left'
    }}>
      <div style={{
        height: height-164-800,
        width: width,
        backgroundColor: '#222222',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <h1 style={{margin: 0, marginBottom: 30, fontWeight: 'lighter'}}>${numberWithCommas(totalWorth)}</h1>
        <div style={{display: 'flex', flexDirection: 'row'}}>
          <PieChart width={460} height={250}>
            <Pie stroke="none" data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} fill="#8884d8" label={entry => entry.name}>
              <Cell fill="#75d8ff" />
              <Cell fill="#ffd859" />
              <Cell fill="#b06bff" />
              <Cell fill="#666666" />
            </Pie>
          </PieChart>
          <RadarChart outerRadius={90} width={460} height={250} data={radarChartData} style={{marginTop: 25}}>
            <PolarGrid />
            <PolarAngleAxis dataKey="type"/>
            <PolarRadiusAxis style={{display: 'none'}} angle={120} domain={[0, 33]} />
            <Radar name="Average ESG" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
          </RadarChart>
        </div>
      </div>
      <Portfolio portfolio={portfolio} setPortfolio={setPortfolio} totalWorth={totalWorth} setTotalWorth={setTotalWorth} unprocessedCompanies={unprocessedCompanies} setUnprocessedCompanies={setUnprocessedCompanies}/>
    </div>
  );
}

function ExploreStock(props) {
  const [data, setData] = useState([]);
  useEffect(() => {
    if (data && data.length === 0) {
      let url = 'https://finnhub.io/api/v1/stock/candle?symbol=';
      url += props.symbol;
      url += '&resolution=';
      if (props.time === '1W' || props.time === '1M')
        url += '5';
      else if (props.time === '3M' || props.time === '6M')
        url += '15';
      else
        url += '30';
      const time = parseInt(new Date().getTime() / 1000);
      let prevTime = time;
      if (props.time === '1W')
        prevTime -= 7 * 24 * 60 * 60;
      else if (props.time === '1M')
        prevTime -= 30 * 24 * 60 * 60;
      else if (props.time === '3M')
        prevTime -= 3 * 30 * 24 * 60 * 60;
      else if (props.time === '6M')
        prevTime -= 6 * 30 * 24 * 60 * 60;
      else
        prevTime -= 12 * 30 * 24 * 60 * 60;
      url += '&from=';
      url += prevTime;
      url += '&to=';
      url += time;
      url += '&token=c5cau7aad3ib55bb0h20';
      if (does_fetch)
        fetch(url).then(response => response.json()).then(data => {
          setData(data["c"].map(x => ({value: x})));
          console.log(props.unprocessedCompanies);
          if (props.unprocessedCompanies && props.unprocessedCompanies.delete(props.symbol)) {
            props.setUnprocessedCompanies(props.unprocessedCompanies);
            props.setTotalWorth(props.totalWorth + data["c"][data["c"].length - 1] * props.numStocks);
          }
        }).catch(error => console.error(error + "fetch error, please check if symbol is correct, but rate limit can also be passed"));
    }
  });
  const symbol = props.symbol;
  // 1W, 1M, 3M, 6M, 1Y
  // const time = props.time;
  const color = data.length > 0 && data[0].value >= data[data.length - 1].value ? 'red' : 'green';
  let chips = [];
  if (props.env_v >= env_threshold)
    chips.push("E");
  if (props.soc_v >= soc_threshold)
    chips.push("S");
  if (props.gov_v >= gov_threshold)
    chips.push("G");
  return (
    <>
      <Divider width="700"/>
      <div style={{display: 'flex', marginBottom: 6, marginTop: 14, cursor: 'pointer'}} onClick={() => props.handleDetailView(symbol, props.name, props.env_v, props.soc_v, props.gov_v, props.numStocks)}>
        <div style={{width: 60, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <span style={{fontSize: 20, fontWeight: 'bold', color: setColor((props.env_v + props.soc_v + props.gov_v - 20))}}>{parseInt(props.env_v+props.soc_v+props.gov_v+0.5)}</span>
          <span style={{fontSize: 16, color: '#aaaaaa'}}>ESG</span>
        </div>
        <div style={{width: 100, display: 'flex', flexDirection: 'column'}}>
          <motion.span layoutId={symbol + "_symbol"} style={{fontSize: 20, fontWeight: 'bold'}}>{symbol}</motion.span>
          <motion.span layoutId={symbol + "_name"} style={{fontSize: 16, color: '#aaaaaa'}}>{props.name}</motion.span>
        </div>
        <motion.div layoutId={symbol + "_chart"}>
          {data.length > 0 ? (
            <LineChart width={400} height={50} data={data}>
              <YAxis style={{display: 'none'}} type="number" domain={['dataMin', 'dataMax']} />
              <Line type="monotone" dataKey="value" stroke={color} dot={false}/>
            </LineChart>
          ) : <div style={{width: 400, height: 50}} />}
        </motion.div>
        <div style={{width: 120, display: 'flex', flexDirection: 'row', marginRight: 16, marginLeft: 16, alignItems: 'center'}}>
          {chips.map((value) => (
            <Chip key={value} label={value} style={{marginBottom: 10, marginRight: 4, color: categoryColorMap[value], backgroundColor: categoryColorMap[value] + '30'}}/>
          ))}
        </div>

      </div>
    </>
  )
}

function AddStock(props) {
  const [symbol, setSymbol] = useState("");
  const [amount, setAmount] = useState(0);

  return (
    <>
      <Divider width="700"/>
      <div style={{width: 700, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginTop: 20}}>
        <TextField label="Symbol" value={symbol} onChange={event => setSymbol(event.target.value)}/>
        <TextField label="Amount" type="number" value={amount} onChange={event => setAmount(parseInt(event.target.value))}/>
        <Button variant="outlined" style={{height: 56, width: 200}} onClick={() => {
          if (companies[symbol] !== undefined) {
            props.setPortfolio(props.portfolio.concat([{symbol: symbol, amount: amount}]));
            props.unprocessedCompanies.add(symbol);
            props.setUnprocessedCompanies(props.unprocessedCompanies)
          }
          setSymbol("");
          setAmount(0);
        }}>Add</Button>
      </div>
    </>
  )
}

function randomKey(object) {
  var keys = Object.keys(object);
  return keys[Math.floor(keys.length * Math.random())];
}

function ExploreScreen(props) {
  const {width} = useWindowDimensions();
  let [suggestions, setSuggestions] = useState([]);
  const [detailed, setDetailed] = useState("");
  const [name, setName] = useState("");
  const [env_v, setEnv_v] = useState(-1);
  const [soc_v, setSoc_v] = useState(-1);
  const [gov_v, setGov_v] = useState(-1);
  // props.searchTags;
  useEffect(() => {
    let result = [];
    let alreadyGood = new Set();
    while (result.length < 10) {
      let randSymb = randomKey(companies);
      if (alreadyGood.has(randSymb))
        continue;
      alreadyGood.add(randSymb);
      const env_v = companies[randSymb][1][1];
      const soc_v = companies[randSymb][1][2];
      const gov_v = companies[randSymb][1][3];
      let good = true;
      for (const i of props.searchTags) {
        if (i === categories[0] && env_v < env_threshold)
          good = false;
        else if (i === categories[1] && soc_v < soc_threshold)
          good = false;
        else if (i === categories[2] && gov_v < gov_threshold)
          good = false;
      }
      if (good)
        result.push({symbol: randSymb, name: companies[randSymb][0], env_v: env_v,
          soc_v: soc_v, gov_v: gov_v});
    }
    setSuggestions(result);
  }, [props.searchTags]);

  /*
  if (suggestions.length === 0)
    setSuggestions([
      {symbol: "AAPL", name: "Apple", env_v: 4, soc_v: 1, gov_v: 30},
      {symbol: "SBUX", name: "Starbucks", env_v: 1, soc_v: 1, gov_v: 0},
      {symbol: "NKE", name: "Nike", env_v: 1, soc_v: 0, gov_v: 1},
      {symbol: "TMUS", name: "TMobile", env_v: 1, soc_v: 0, gov_v: 0},
      {symbol: "DRIP", name: "Direxion", env_v: 0, soc_v: 1, gov_v: 1},
      {symbol: "AMZN", name: "Amazon", env_v: 0, soc_v: 1, gov_v: 0},
      {symbol: "FB", name: "Facebook", env_v: 0, soc_v: 0, gov_v: 1},
      {symbol: "GOOGL", name: "Google", env_v: 0, soc_v: 0, gov_v: 0},
      {symbol: "TSLA", name: "Tesla", env_v: 0, soc_v: 0, gov_v: 0},
      {symbol: "MSC", name: "Music City", env_v: 0, soc_v: 0, gov_v: 0},
    ]);
    */

  function handleDetailView(symbol, name, env_v, soc_v, gov_v, numStocks) {
    setDetailed(symbol);
    setName(name);
    setEnv_v(env_v);
    setSoc_v(soc_v);
    setGov_v(gov_v);
  }

  return (
    <div style={{
      paddingLeft: 340,
      textAlign: 'left',
      color: '#eeeeee',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#222222',
      width: width - 340
    }}>
      <AnimateSharedLayout>
        {suggestions.map(suggestion => (
          <ExploreStock key={suggestion.symbol} symbol={suggestion.symbol} name={suggestion.name} time={"1W"} env_v={suggestion.env_v} soc_v={suggestion.soc_v} gov_v={suggestion.gov_v} handleDetailView={handleDetailView} numStocks={-1}/>
        ))}
        <Backdrop showBackdrop={detailed !== ""} leaveDetailed={() => setDetailed("")}/>
        {detailed !== "" && <DetailedView symbol={detailed} name={name} env_v={env_v} soc_v={soc_v} gov_v={gov_v}/>}
      </AnimateSharedLayout>
    </div>
  );
}

function App() {
  const {width, height} = useWindowDimensions();
  const [state, setState] = useState("atHome");
  const variantHome = {
    atHome: {
      clipPath: `circle(10000px at 382px -82px)`,
    },
    transitionToExplore: {
      clipPath: `circle(1337px at 382px -82px)`,
    },
    atExplore: {
      clipPath: `circle(0px at 382px -82px)`,
    },
    transitionToHome: {
      clipPath: `circle(1337px at 382px -82px)`,
      transition: {
        type: "spring",
        stiffness: 100,
      }
    },
  }
  const variantExplore = {
    atHome: {
      clipPath: `circle(0px at ${width - 382}px -82px)`,
    },
    transitionToExplore: {
      clipPath: `circle(1337px at ${width - 382}px -82px)`,
      transition: {
        type: "spring",
        stiffness: 100,
      }
    },
    atExplore: {
      clipPath: `circle(10000px at ${width - 382}px -82px)`,
    },
    transitionToHome: {
      clipPath: `circle(1337px at ${width - 382}px -82px)`,
    },
  }

  function changeScreen(screen) {
    if (screen && state === "atHome") {
      // go to home screen
      setState("transitionToExplore");
    } else if (!screen && state === "atExplore") {
      // go to explore screen
      setState("transitionToHome");
    }
  }

  function animationComplete() {
    if (state === "transitionToExplore") {
      setState("atExplore");
    } else if (state === "transitionToHome") {
      setState("atHome");
    }
  }

  const [searchTags, setSearchTags] = useState([]);

  return (
    <div className="App" style={{backgroundColor: "#222222", position: 'absolute', width: '100%', height: height * 4}}>
      <motion.header className="App-header" animate={state} onAnimationComplete={animationComplete}>
        <Header changeScreen={changeScreen} state={state} searchTags={searchTags} setSearchTags={setSearchTags}/>
        <motion.div style={{position: state === "atHome" ? 'block' : 'absolute', top: 164, zIndex: (
          state === "atHome" || state === "transitionToHome" ? 2 : 1
        )}} variants={variantHome}>
          <HomeScreen/>
        </motion.div>
        <motion.div style={{position: state === "atExplore" ? 'block' : 'absolute', top: 164, zIndex: (
          state === "atExplore" || state === "transitionToExplore" ? 2 : 1
        )}} variants={variantExplore}>
          <ExploreScreen searchTags={searchTags}/>
        </motion.div>
      </motion.header>
    </div>
  );
}

export default App;