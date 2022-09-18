/* Imports */
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import { useEffect } from "react";
import { chain } from "lodash";


interface AnalyticEvent {
    name: string,
    session: string,
    date: number,
    id: string,
}

const contracts = [
    { address: '\\x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', name: "Sushi Swap" },
    { address: '\\x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', name: "Uni Swap" }
];

function findContract(address: string): any {
    for (const contract of contracts) {
        if (contract.address.toLowerCase() === address.toLowerCase()) {
            return contract
        }
    }
}

function Path({ dune, data }) {
    useEffect(() => {
        if (dune && data) {
            const funnelEvents = [
                "Application Loaded",
                "Wallet Connect Transaction Completed",
                "Token Selector Opened",
                "Swap Submit Button Clicked"];
            const extra1 = "Tx to Sushi Swap"
            const extra2 = "Tx to Uni Swap"
            const duneEvents: any[] = dune.result.rows.slice(-2)
            const ipfsEvents: AnalyticEvent[] = data.events

            var events = chain(ipfsEvents)
                .filter((e: any) =>
                    funnelEvents.includes(e.name)
                )
                .uniqBy((e: any) => {
                    return e.name + e.session
                })
                .value()


            for (const item of duneEvents) {
                const event = {} as AnalyticEvent;
                const contract = findContract(item.to)
                event.name = `Tx to ${contract.name}`
                event.date = new Date(item.block_time).valueOf();
                event.session = "";
                events.push(event)
            }

            events = chain(events).sortBy("date").value()

            for (var i = 0; i < events.length; i++) {
                if (events[i].session === "" && i > 0) {
                    // if (!events[i - 1].name.prototype.startsWith('Tx')){
                    events[i].session = events[i - 1].session
                    // } else if (!events[i - 1].name.prototype.startsWith('Tx')){
                    //     events[i].session = events[i - 1].session
                    // }

                }
            }

            events = chain(events)
                .uniqBy((e: any) => {
                    return e.name + e.session
                })
                .groupBy('session')
                .value()

            var stats = [];

            for (const session in events) {

                for (var i = 0; i < events[session].length; i++) {
                    if (i < events[session].length - 1) {
                        const elem = {
                            "from": events[session][i].name,
                            "to": events[session][i + 1].name,
                            "value": 1
                        }
                        stats.push(elem)

                    }

                    if (i === events[session].length - 1) {
                        const elem = {
                            "from": events[session][i].name,
                            "value": 1
                        }
                        stats.push(elem)

                    }
                }
            }

            stats = chain(stats)
                .groupBy((e) => {
                    if (e.to) {
                        return `${e.from}-${e.to}`
                    } else {
                        return `${e.from}`
                    }

                })
                .value()

            var chart = am4core.create("chartdiv", am4charts.SankeyDiagram);

            console.log(stats)


            const chartData = []

            if (stats[`${funnelEvents[0]}-${funnelEvents[1]}`]) {
                chartData.push({ "from": funnelEvents[0], "to": funnelEvents[1], "value": stats[`${funnelEvents[0]}-${funnelEvents[1]}`].length })
            }

            if (stats[`${funnelEvents[0]}`]) {
                chartData.push({ "from": funnelEvents[0], "value": stats[`${funnelEvents[0]}`].length })
            }

            if (stats[`${funnelEvents[2]}`]) {
                chartData.push({ "from": funnelEvents[2], "value": stats[`${funnelEvents[2]}`].length })
            }

            if (stats[`${funnelEvents[1]}-${funnelEvents[2]}`]) {
                chartData.push({ "from": funnelEvents[1], "to": funnelEvents[2], "value": stats[`${funnelEvents[1]}-${funnelEvents[2]}`].length, nodeColor: "#FF4F4F" })
            }

            if (stats[`${funnelEvents[2]}-${funnelEvents[3]}`]) {
                chartData.push({ "from": funnelEvents[2], "to": funnelEvents[3], "value": stats[`${funnelEvents[2]}-${funnelEvents[3]}`].length, nodeColor: "#06D6A0" })
            }

            if (stats[`${funnelEvents[3]}-${extra1}`]) {
                chartData.push({ "from": funnelEvents[3], "to": extra1, "value": stats[`${funnelEvents[3]}-${extra1}`].length, nodeColor: "#FF4F4F" })
            }

            if (stats[`${funnelEvents[3]}-${extra2}`]) {
                chartData.push({ "from": funnelEvents[3], "to": extra2, "value": stats[`${funnelEvents[3]}-${extra2}`].length, nodeColor: "#06D6A0" })
            }

            if (stats[`${funnelEvents[2]}-${extra1}`]) {
                chartData.push({ "from": funnelEvents[2], "to": extra1, "value": stats[`${funnelEvents[2]}-${extra1}`].length, nodeColor: "#FF4F4F" })
            }

            chart.data = chartData;

            // Configure data fields
            chart.dataFields.fromName = "from";
            chart.dataFields.toName = "to";
            chart.dataFields.value = "value";
            chart.dataFields.color = "nodeColor";
            chart.padding(0, 300, 10, 0);


            // Configure links
            chart.links.template.colorMode = "gradient";
            chart.links.template.tooltipText = "{fromName} → {toName}: [bold]{value}[/]";
            var hoverState = chart.links.template.states.create("hover");
            hoverState.properties.fillOpacity = 1

            // Configure nodes
            chart.nodes.template.cursorOverStyle = am4core.MouseCursorStyle.pointer;
            chart.nodes.template.readerTitle = "Click to show/hide or drag to rearrange";
            chart.nodes.template.showSystemTooltip = true;

            chart.nodes.template.cursorOverStyle = am4core.MouseCursorStyle.pointer;
        }
    }, [dune, data])

    return (
        <div id="chartdiv">
        </div>
    );
}

export default Path;
