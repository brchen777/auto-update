(()=>{
    "use strict";
    
    const { moment, pump } = window;
    const UNITS = { DAY: 86400, HOUR: 3600, MINUTE: 60, SECOND: 1 };
    const healthyBound = 10 * UNITS.MINUTE;
    const warningBound = 20 * UNITS.MINUTE;
    const container = $('#info-container');
    const tpl = $('script[data-tpl="server-item"]').html();

    let kernel = pump.instantiate();
    kernel.on('system-ready', ()=>{
        let data = window.INPUT_DATA || [];
        let rowContainer = $('<ul>').addClass('server-item-row');
        let counter = 0;
        
        data.forEach((serverInfo)=>{
            let ratios = { cpu: 0, mem: 0, disk: 0 };
            for (let val of serverInfo.cpu) {
                ratios.cpu += val;
            }

            let diskIds = Object.keys(serverInfo.disk);
            for (let diskId of diskIds) {
                ratios.disk += serverInfo.disk[diskId];
            }

            ratios.cpu = Math.round(ratios.cpu / serverInfo.cpu.length);
            ratios.mem = Math.round(serverInfo.mem);
            ratios.disk = Math.round(ratios.disk / diskIds.length);

            let diff = moment().unix() - serverInfo.time;
            let timeStr = '';

            if (diff < UNITS.MINUTE) {
                timeStr = `${diff} second${diff > 1 ? 's' : ''} ago`;
            }
            else if (diff < UNITS.HOUR) {
                let diff_reduced = (diff / UNITS.MINUTE) | 0;
                timeStr = `${diff_reduced} minute${diff_reduced > 1 ? 's' : ''} ago`;
            }
            else if (diff < UNITS.DAY) {
                let diff_reduced = (diff / UNITS.HOUR) | 0;
                timeStr = `${diff_reduced} hour${diff_reduced > 1 ? 's' : ''} ago`;
            }
            else {
                timeStr = moment.unix(serverInfo.time).format('YYYY/MM/DD HH:mm');
            }

            let item = $.tmpl(tpl, {
                active: true,
                id: serverInfo.id,
                uid: serverInfo.uid,
                cpuRate: `${ratios.cpu}%`,
                memRate: `${ratios.mem}%`,
                diskRate: `${ratios.disk}%`,
                updateTime: timeStr
            });

            if (diff < healthyBound) {
                item.removeClass('warn').removeClass('danger');
            }
            else if (diff >= healthyBound && diff <= warningBound) {
                item.removeClass('danger').addClass('warn');
            }
            else {
                item.removeClass('warn').addClass('danger');
            }

            item.find('div.info-bar').each((idx, info)=>{
                let target = $(info);
                let type = target.attr('data-inspect');
                target.find('.progress > .bar').css({width:`${ratios[type]}%`});

                if (ratios[type] >= 80) {
                    target.find('.progress > .bar').addClass('warning');
                }
                else if (80 > ratios[type] && ratios[type] >= 40) {
                    target.find('.progress > .bar').addClass('busy');
                }
                else {
                    target.find('.progress > .bar').addClass('normal');
                }
            });

            if (counter++ >= 4) {
                container.append(rowContainer);
                rowContainer = $('<ul>').addClass('server-item-row');
                counter -= 4;
            }

            rowContainer.append(item);
        });
        
        if (counter > 0) {
            let dummy = 4 - counter;
            while(dummy-- > 0) {
                $.tmpl(tpl, {
                    active: false,
                    id: '',
                    uid: '',
                    cpuRate: 0,
                    memRate: 0,
                    diskRate: 0,
                    updateTime: ''
                }).appendTo(rowContainer);
            }

            container.append(rowContainer);
        }
    });
})();
