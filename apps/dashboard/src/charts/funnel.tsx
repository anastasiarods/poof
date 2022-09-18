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

// Themes begin
am4core.useTheme(am4themes_animated);
// Themes end

function Funnel({ data }) {
    useEffect(() => {
        if (data) {
            const funnelEvents = ["Application Loaded", "Wallet Connect Transaction Completed", "Token Selector Opened", "Swap Submit Button Clicked"];

            const events: AnalyticEvent[] = data.events

            const grouppedBySession = chain(events)
                .filter((e: any) =>
                    funnelEvents.includes(e.name)
                )
                .sortBy("date")
                .uniqBy((e: any) => {
                    return e.name + e.session
                })
                .groupBy('session')
                .value()

            const stats = {
                0: 0,
                1: 0,
                2: 0,
                3: 0
            };
            for (const property in grouppedBySession) {
                const session = grouppedBySession[property];
                const sorted: AnalyticEvent[] = session.sort((a: AnalyticEvent, b: AnalyticEvent) => a.date - b.date);
                for (var i = 0; i < sorted.length; i++) {
                    if (sorted[i].name === funnelEvents[0]) {
                        stats["0"] = stats["0"] + 1;
                    }

                    if (
                        i > 0 &&
                        sorted[i - 1].name === funnelEvents[0] &&
                        sorted[i].name === funnelEvents[1]
                    ) {

                        stats["1"] = stats["1"] + 1;
                    }
                    if (
                        i > 1 &&
                        sorted[i - 2].name === funnelEvents[0] &&
                        sorted[i - 1].name === funnelEvents[1] &&
                        sorted[i].name === funnelEvents[2]
                    ) {

                        stats["2"] = stats["2"] + 1;
                    }

                    if (
                        i > 2 &&
                        sorted[i - 3].name === funnelEvents[0] &&
                        sorted[i - 2].name === funnelEvents[1] &&
                        sorted[i - 1].name === funnelEvents[2] &&
                        sorted[i].name === funnelEvents[3]
                    ) {

                        stats["3"] = stats["3"] + 1;
                    }
                }
            }

            var chart = am4core.create("chartdiv", am4charts.SlicedChart);
            chart.hiddenState.properties.opacity = 0; // this makes initial fade in effect
            var series = chart.series.push(new am4charts.FunnelSeries());
            series.colors.step = 2;
            series.dataFields.value = "value";
            series.dataFields.category = "name";
            series.alignLabels = true;
            series.orientation = "vertical";
            series.bottomRatio = 1;
            series.calculatePercent = true;

            series.alignLabels = true;

            series.labels.template.adapter.add("text", slicePercent);
            series.tooltip.label.adapter.add("text", slicePercent);

            function slicePercent(text, target) {
                var max = target.dataItem.values.value.value - target.dataItem.values.value.startChange;
                var percent = Math.round(target.dataItem.values.value.value / max * 100);
                return "{category}: " + percent + "%";
            }



            chart.data = [{
                "name": funnelEvents[0],
                "value": stats[0]
            }, {
                "name": funnelEvents[1],
                "value": stats[1]
            }, {
                "name": funnelEvents[2],
                "value": stats[2]
            }, {
                "name": funnelEvents[3],
                "value": stats[3]
            }];

            // chart.legend = new am4charts.Legend();
            // chart.legend.position = "top";
        }
    }, [data])


    return (
        <div id="chartdiv">
        </div>
    );
}

export default Funnel;
