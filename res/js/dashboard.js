(()=>{
    "use strict";
    
    const { moment, pump } = window;
    const UNITS = { DAY: 86400, HOUR: 3600, MINUTE: 60, SECOND: 1 };
    const aliveHealthyBound = 10 * UNITS.MINUTE;
    const aliveWarningBound = 20 * UNITS.MINUTE;
    const progressWarningBound = 80;
    const progressBusyBound = 40;
    const container = $('#info-container');
    const tpl = $('script[data-tpl="server-item"]').html();
    const rowMax = 10;

    let kernel = pump.instantiate();
    kernel.on('system-ready', ()=>{
        let data = window.INPUT_DATA || [];
        let colContainer = $('<div>').addClass('server-item-col clearfix');
        let counter = 0;
        
        data.forEach((serverInfo)=>{
            let ratios = { cpu: 0, mem: 0, disk: 0 };
            let diskIds = Object.keys(serverInfo.disk);
            for (let diskId of diskIds) {
                ratios.disk += serverInfo.disk[diskId];
            }

            ratios.cpu = Math.round(serverInfo.cpu);
            ratios.mem = Math.round(serverInfo.mem);
            ratios.disk = (diskIds.length) ? Math.round(ratios.disk / diskIds.length) : 0;

            let aliveDiff = moment().unix() - serverInfo.aliveTime;
            let aliveTimeStr = '-';
            if (aliveDiff < UNITS.MINUTE) {
                aliveTimeStr = `${aliveDiff} second${(aliveDiff > 1) ? 's' : ''} ago`;
            }
            else if (aliveDiff < UNITS.HOUR) {
                let diffMinute = (aliveDiff / UNITS.MINUTE) | 0;
                aliveTimeStr = `${diffMinute} minute${(diffMinute > 1) ? 's' : ''} ago`;
            }
            else if (aliveDiff < UNITS.DAY) {
                let diffHour = (aliveDiff / UNITS.MINUTE) | 0;
                aliveTimeStr = `${diffHour} hour${(diffHour > 1) ? 's' : ''} ago`;
            }
            else {
                aliveTimeStr = moment.unix(serverInfo.aliveTime).format('YYYY/MM/DD HH:mm');
            }

            let lastUpdateDiff = moment().unix() - serverInfo.lastUpdateTime;
            let lastUpdateTimeStr = '-';
            if (lastUpdateDiff < UNITS.MINUTE) {
                lastUpdateTimeStr = `${lastUpdateDiff} second${(lastUpdateDiff > 1) ? 's' : ''} ago`;
            }
            else if (lastUpdateDiff < UNITS.HOUR) {
                let diffMinute = (lastUpdateDiff / UNITS.MINUTE) | 0;
                lastUpdateTimeStr = `${diffMinute} minute${(diffMinute > 1) ? 's' : ''} ago`;
            }
            else if (lastUpdateDiff < UNITS.DAY) {
                let diffHour = (lastUpdateDiff / UNITS.MINUTE) | 0;
                lastUpdateTimeStr = `${diffHour} hour${(diffHour > 1) ? 's' : ''} ago`;
            }
            else {
                lastUpdateTimeStr = moment.unix(serverInfo.lastUpdateTime).format('YYYY/MM/DD HH:mm');
            }

            let item = $.tmpl(tpl, {
                id: serverInfo.id,
                uid: serverInfo.uid,
                cpuRate: `${ratios.cpu}%`,
                memRate: `${ratios.mem}%`,
                diskRate: `${ratios.disk}%`,
                aliveTime: aliveTimeStr,
                lastPackName: serverInfo.lastPackName,
                lastUpdateTime: lastUpdateTimeStr
            });

            if (aliveHealthyBound > aliveDiff) {
                item.removeClass('warn').removeClass('danger');
            }
            else if (aliveWarningBound >= aliveDiff && aliveDiff >= aliveHealthyBound) {
                item.removeClass('danger').addClass('warn');
            }
            else {
                item.removeClass('warn').addClass('danger');
            }

            item.find('div.info-bar').each((idx, info)=>{
                let target = $(info);
                let type = target.attr('data-inspect');
                target.find('.progress > .bar').css({width:`${ratios[type]}%`});

                if (ratios[type] >= progressWarningBound) {
                    target.find('.progress > .bar').addClass('warning');
                }
                else if (progressWarningBound > ratios[type] && ratios[type] >= progressBusyBound) {
                    target.find('.progress > .bar').addClass('busy');
                }
                else {
                    target.find('.progress > .bar').addClass('normal');
                }
            });

            if (counter++ >= rowMax) {
                container.append(colContainer);
                colContainer = $('<div>').addClass('server-item-col clearfix');
                counter -= rowMax;
            }
            colContainer.append(item);
        });

        if (counter > 0) {
            container.append(colContainer);
        }
    });
})();
