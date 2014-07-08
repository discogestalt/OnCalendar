var current_user = {};
var oc_user_event = new Event('user_info_loaded');
var oc_group_event = new Event ('group_info_loaded');
var email_gateway_config = {{ email_gateway_config }};

{% if g.user.is_anonymous() %}
current_user = {{ user_json }}
{% else %}
$.when(oncalendar.get_victim_info('id', {{ g.user.id }})).then(function(data) {
	current_user = data[{{ g.user.id }}];
    document.dispatchEvent(oc_user_event);
});
{% endif %}

// Set up group turnover info and color key
oncalendar.group_color_map = {};
$.when(oncalendar.get_group_info()).then(function(data) {
    oncalendar.oncall_groups = data;
	if (typeof oncalendar.oncall_groups === "undefined") {
		alert('no group info found, please try again');
	}
    group_count = 0;
    $.each(Object.keys(oncalendar.oncall_groups).sort(), function (i, name) {
        if (oncalendar.oncall_groups[name].turnover_hour < 10) {
            oncalendar.oncall_groups[name].turnover_hour = '0' + oncalendar.oncall_groups[name].turnover_hour;
        }
        if (oncalendar.oncall_groups[name].turnover_min < 10) {
            oncalendar.oncall_groups[name].turnover_min = '0' + oncalendar.oncall_groups[name].turnover_min;
        }
        oncalendar.oncall_groups[name].turnover_string = oncalendar.oncall_groups[name].turnover_hour + '-' + oncalendar.oncall_groups[name].turnover_min;
        oncalendar.group_color_map[name] = color_wheel.Wheel[5][group_count];
        group_count++;
	});
	document.dispatchEvent(oc_group_event);
});

{% block page_script %}

for (i = 0; i <= 23; i++) {
    if (i < 10) {
        i = '0' + i;
    }
    $('table#edit-day-slots-table')
        .append('<tr id="slot-' + i + '-00-oncall" class="oncall-row"><td>' + i + ':00</td><td>Oncall:</td><td><span class="edit-slot-menu dropdown">' +
            '<span data-toggle="dropdown">' +
            '<button id="slot-' + i + '-00-oncall-button" class="edit-day-oncall-button" data-slot="' + i + '-00">--</button></span>' +
            '<ul id="slot-' + i + '-00-victim-options" class="slot-menu dropdown-menu" role="menu"></ul></span></td></tr>')
        .append('<tr id="slot' + i + '-00-shadow" class="shadow-row hide"><td></td><td>Shadow:</td><td><span class="edit-slot-menu dropdown">' +
            '<span data-toggle="dropdown">' +
            '<button id="slot-' + i + '-00-shadow-button" class="edit-day-shadow-button" data-slot="' + i + '-00">--</button></span>' +
            '<ul id="slot-' + i + '-00-shadow-options" class="slot-menu dropdown-menu" role="menu"></ul></span></td></tr>')
        .append('<tr id="slot' + i + '-00-backup" class="backup-row hide"><td></td><td>Backup:</td><td><span class="edit-slot-menu dropdown">' +
			'<span data-toggle="dropdown">' +
            '<button id="slot-' + i + '-00-backup-button" class="edit-day-backup-button" data-slot="' + i + '-00">--</button></span>' +
			'<ul id="slot-' + i + '-00-backup-options" class="slot-menu dropdown-menu" role="menu"></ul></span></td></tr>')
        .append('<tr id="slot-' + i + '-30-oncall" class="oncall-row"><td>' + i + ':30</td><td>Oncall:</td><td><span class="edit-slot-menu dropdown">' +
            '<span data-toggle="dropdown">' +
            '<button id="slot-' + i + '-30-oncall-button" class="edit-day-oncall-button" data-slot="' + i + '-30">--</button></span>' +
            '<ul id="slot-' + i + '-30-victim-options" class="slot-menu slot-options dropdown-menu" role="menu"></ul></span></td></tr>')
        .append('<tr id="slot' + i + '-30-shadow" class="shadow-row hide"><td></td><td>Shadow:</td><td><span class="edit-slot-menu dropdown">' +
            '<span data-toggle="dropdown">' +
            '<button id="slot-' + i + '-30-shadow-button" class="edit-day-shadow-button" data-slot="' + i + '-30">--</button></span>' +
            '<ul id="slot-' + i + '-30-shadow-options" class="slot-menu slot-options dropdown-menu" role="menu"></ul></span></td></tr>')
		.append('<tr id="slot' + i + '-30-backup" class="backup-row hide"><td></td><td>Backup:</td><td><span class="edit-slot-menu dropdown">' +
            '<span data-toggle="dropdown">' +
            '<button id="slot-' + i + '-30-backup-button" class="edit-day-backup-button" data-slot="' + i + '-30">--</button></span>' +
            '<ul id="slot-' + i + '-30-backup-options" class="slot-menu slot-options dropdown-menu" role="menu"></ul></span></td></tr>')
}

$(document).ready(function() {
    // Autocomplete suggestions for adding victims to a group
    $('input#add-victim-username').autocomplete({
        minChars: 2,
        serviceUrl: '/api/victims/suggest',
        containerClass: 'autocomplete-suggestions dropdown-menu',
        appendTo: '#victim-username-textbox',
        zIndex: 9999,
        maxHeight: 300,
        maxWidth: 300,
        onSelect: function(suggestion) {
            $('input#victim-id').val(suggestion.data.id);
            $('input#add-victim-firstname').val(suggestion.data.firstname);
            $('input#add-victim-lastname').val(suggestion.data.lastname);
            $('input#add-victim-phone').val(suggestion.data.phone);
            $('input#add-victim-email').val(suggestion.data.email);
            $('input#add-victim-sms-email').val(suggestion.data.sms_email);
        }
    });

    $('div#user-menu').on('click', 'li#edit-account-menu-option', function() {
        $.magnificPopup.open({
            items: {
                src: '#edit-account-info-popup',
                type: 'inline'
            },
            preloader: false,
            removalDelay: 300,
            mainClass: 'popup-animate'
        });
    });
});

document.addEventListener('user_info_loaded', function() {
	$('input#edit-account-firstname').attr('value', current_user.firstname);
	$('input#edit-account-lastname').attr('value', current_user.lastname);
	$('input#edit-account-phone').attr('value', current_user.phone);
	$('input#edit-account-email').attr('value', current_user.email);
	$('input#edit-account-sms-email').attr('value', current_user.sms_email);
	$('input#edit-account-throttle').attr('value', current_user.throttle);
	if (current_user.truncate > 0) {
		$('button#edit-account-truncate-checkbox').removeClass('icon_box-empty').addClass('icon_box-checked').attr('data-checked', 'yes');
		$('input#edit-account-truncate').attr('value', 'yes');
	}
	$.each(current_user.groups, function(group, active) {
		$('table#account-info-table').children('tbody').append('<tr><td>' + group + '</td>' +
			'<td><button id="edit-account-' + group + '-active-checkbox" class="oc-checkbox elegant_icons icon_box-checked" data-target="edit-account-' + group + '-active" data-group="' + group + '" data-checked="yes"></button>' +
			'<input type="hidden" id="edit-account-' + group + '-active" name="edit-account-' + group + '-active" class="group-active-input" data-group="' + group + '" value="yes"></td><td colspan="5"></td></tr>');
		if (active == 0) {
			$('button#edit-account-' + group + '-active-checkbox').removeClass('icon_box-checked').addClass('icon_box-empty').attr('data-checked', 'no');
			$('input#edit-account-' + group + '-active').attr('value', 'no');
		}
	});
}, false);

document.addEventListener('group_info_loaded', function() {
	$.each(Object.keys(oncalendar.oncall_groups).sort(), function (i, name) {
        if (oncalendar.oncall_groups[name].active ==1 && oncalendar.oncall_groups[name].autorotate == 1) {
            $('div#group-legend').append('<div class="expander"><span class="expander-arrow elegant_icons arrow_carrot-right" ' +
                'data-state="closed"  data-group="' + name + '" data-groupid="' + oncalendar.oncall_groups[name].id + '"></span>' +
                '<span class="group-legend-entry" style="color: ' + oncalendar.group_color_map[name] + ';">' + name + '</span></div>');
        }
    });
{% if month is defined and year is defined %}
	var incoming_month = {{ month }};
	var incoming_year = {{ year }};
	$.when(oncalendar.build_calendar(incoming_year, incoming_month)).then(
		function() {
			oncalendar.display_calendar();
            $('div#working').remove();
		}
	);
{% else %}
	$.when(oncalendar.build_calendar()).then(
		function() {
			oncalendar.display_calendar();
            $('div#working').remove();
		}
	);
{% endif %}

}, false);

// Edit the schedule for a specific day
var edit_calday = function(target_group, calday, cal_date) {

    $('#edit-day-group').text(' - ' + target_group);
    if (oncalendar.oncall_groups[target_group].shadow == 1) {
        $('tr.shadow-row').removeClass('hide');
    }
    if (oncalendar.oncall_groups[target_group].backup == 1) {
        $('tr.backup-row').removeClass('hide');
    }

    $('button#edit-day-save-button').attr('data-calday', calday).attr('data-group', target_group).attr('data-date', cal_date);
    $('ul.slot-menu').append('<li><span class="slot-item" data-target="--">--</span></li>')
    $.each(oncalendar.oncall_groups[target_group].victims, function(i, victim) {
        if (victim.group_active == 1) {
            $('ul.slot-menu').append('<li><span class="slot-item" data-target="' + victim.username + '">' + victim.username + '</span></li>');
        }
    });

    $.each(Object.keys(oncalendar.victims[calday].slots).sort(), function(i, slot) {
        $('button#slot-' + slot + '-oncall-button').text(
                typeof oncalendar.victims[calday].slots[slot][target_group] !== "undefined" &&
                    oncalendar.victims[calday].slots[slot][target_group].oncall !== null ?
                    oncalendar.victims[calday].slots[slot][target_group].oncall : '--'
        )
        .append('<span class="elegant_icons arrow_carrot-down">');
        $('button#slot-' + slot + '-shadow-button').text(
                typeof oncalendar.victims[calday].slots[slot][target_group] !== "undefined" &&
                    oncalendar.victims[calday].slots[slot][target_group].shadow !== null ?
                    oncalendar.victims[calday].slots[slot][target_group].shadow : '--'
        )
        .append('<span class="elegant_icons arrow_carrot-down">');
        $('button#slot-' + slot + '-backup-button').text(
                typeof oncalendar.victims[calday].slots[slot][target_group] !== "undefined" &&
                    oncalendar.victims[calday].slots[slot][target_group].backup !== null ?
                    oncalendar.victims[calday].slots[slot][target_group].backup : '--'
        )
        .append('<span class="elegant_icons arrow_carrot-down">');
    });

    $.magnificPopup.open({
        items: {
            src: '#edit-day-popup',
            type: 'inline'
        },
        preloader: false,
        removalDelay: 300,
        mainClass: 'popup-animate',
        callbacks: {
            close: function() {
                $('ul.slot-menu').empty();
                $('#edit-day-group').empty();
                $('textarea#edit-day-note').attr('value', '');
                $('tr.shadow-row').addClass('hide');
				$('tr.backup-row').addClass('hide');
                $('button.edit-day-oncall-button').text('').removeAttr('data-target', '');
                $('button.edit-day-shadow-button').text('').removeAttr('data-target', '');
                $('button#edit-day-save-button').removeAttr('data-calday', '').removeAttr('data-group', '');
            }
        }
    });
};

// Populate the info in the group info panels
var populate_group_info = function(target_group) {

    $('div#group-info-box-head').empty().append('<h2>' + target_group + '</h2>');
    if ((current_user.app_role === 2) || (current_user.app_role === 1 && $.inArray(target_group, current_user.groups) != -1)) {
        var group_members_head = $('th#group-members-head');
        if (group_members_head.has('button#edit-members').length != 0) {
            group_members_head.children('button#edit-members').remove();
        }
        group_members_head.append('<button id="edit-members" class="button elegant_icons icon_pencil-edit" ' +
            'data-target="' + target_group + '" data-groupid="' + oncalendar.oncall_groups[target_group].id + '" style="font-weight: normal;"></button>');
        $('div#group-info-box-head').append('<button id="edit-group-info" class="elegant_icons icon_pencil-edit" data-target="' + target_group + '"></button>')
    } else {
        $('th#group-members-head').children('button#edit-members').remove();
        $('div#group-info-box-head').children('button#edit-group-info').remove();
    }
    if (current_user.app_role === 2 || $.inArray(target_group, current_user.groups) != -1) {
        $('span#edit-month-link-container')
            .html('<button id="edit-month-button" data-target="' + target_group + '">Edit Month By Day</button>');
        $('span#edit-by-week-link-container')
            .html('<button id="edit-by-week-button" data-target="' + target_group + '">Edit Month By Week</button>');
    } else {
        $('span#edit-month-link-container').empty();
        $('span#edit-by-week-link-container').empty();
    }
    $('td#group-turnover-day').text(oc.day_strings[oncalendar.oncall_groups[target_group].turnover_day]);
    $('td#group-default-turnover-time').text(oncalendar.oncall_groups[target_group].turnover_hour + ':' + oncalendar.oncall_groups[target_group].turnover_min);
    $('td#group-email-address').text(oncalendar.oncall_groups[target_group].email);
    $('td#group-autorotate').text(oncalendar.oncall_groups[target_group].autorotate ? 'Active' : 'Inactive');
    $('td#group-shadow').text(oncalendar.oncall_groups[target_group].shadow ? 'Enabled' : 'Not Enabled');
    $('td#group-backup').text(oncalendar.oncall_groups[target_group].backup ? 'Enabled' : 'Not Enabled')
    if (oncalendar.oncall_groups[target_group].victimid !== null) {
        var current_oncall = oncalendar.oncall_groups[target_group].victimid
        $('td#group-current-oncall').text(
            oncalendar.oncall_groups[target_group].victims[current_oncall].firstname + ' ' +
            oncalendar.oncall_groups[target_group].victims[current_oncall].lastname + ' '
        );
        if (current_user.username !== "anonymous") {
            $('td#group-current-oncall').append(
                '<span>&bull;<button id="page-oncall-button" class="page-primary-button" data-target="' + target_group + '">Send Page</button>' +
				'</span><span>&bull;<button id="panic-page-group-button" class="panic-page-button" data-target="' + target_group + '">Panic Page to Group</button></span>'
            );
        }
    }

    oncalendar.oncall_groups[target_group].active_victims = [];
    $.each(oncalendar.oncall_groups[target_group].victims, function(id, victim) {
        if (victim.group_active == 1) {
            oncalendar.oncall_groups[target_group].active_victims.push(victim.username);
        }
    });
    $('td#group-members').text(oncalendar.oncall_groups[target_group].active_victims.join(', '));

	$('td#group-edit-log').empty();
    if (current_user.app_role === 2 || $.inArray(target_group, current_user.groups) != -1) {
        $('th#group-edit-log-head').removeClass('hide');
        $.when(oncalendar.get_last_group_edit(oncalendar.oncall_groups[target_group].id)).then(function(data) {
            if (data.ts) {
                var log_string = data.ts + ' - ' + data.updater + ' - ' + data.note;
            } else {
                var log_string = data.note;
            }
            $('td#group-edit-log').text(log_string);
        });
    } else {
        $('th#group-edit-log-head').addClass('hide');
    }
    if (typeof sessionStorage[target_group] === "undefined") {
        sessionStorage[target_group] = 'on';
    }
    $('button#toggle-group-button').attr('data-target', target_group).attr('data-state', sessionStorage[target_group]);
    if (sessionStorage[target_group] === "on") {
        $('button#toggle-group-button').text('Hide This Group')
    } else {
        $('button#toggle-group-button').text('Show This Group');
    }
    $('button#hide-others-button').attr('data-target', target_group);
};

// Simple validation for email addresses
var valid_email = function(email_address) {
    valid = email_address.match(/^[^\s]+@[^\s]+\.[^\s]{2,3}$/);
    if (valid !== null) {
        return true;
    } else {
        return false;
    }
};

$('#prev-month-button').click(function() {
    oncalendar.go_to_prev_month();
});
$('#next-month-button').click(function() {
    oncalendar.go_to_next_month();
});

$('#calendar-header')
    .on('mouseover', '.prev-arrow-button', function() {
        $(this).removeClass('arrow_carrot-left_alt2').addClass('arrow_carrot-left_alt');
    })
    .on('mouseout', '.prev-arrow-button', function() {
        $(this).removeClass('arrow_carrot-left_alt').addClass('arrow_carrot-left_alt2');
    })
    .on('mouseover', '.next-arrow-button', function() {
        $(this).removeClass('arrow_carrot-right_alt2').addClass('arrow_carrot-right_alt');
    })
    .on('mouseout', '.next-arrow-button', function() {
        $(this).removeClass('arrow_carrot-right_alt').addClass('arrow_carrot-right_alt2');
    });

$('#group-legend').on('click', 'div.expander', function() {
    if ($(this).children('.expander-arrow').attr('data-state') === "closed") {
        var target_group = $(this).children('.expander-arrow').attr('data-group');
        $(this).addClass('open');
        populate_group_info(target_group);
        $(this).children('.expander-arrow').removeClass('arrow_carrot-right').addClass('arrow_carrot-down').attr('data-state', 'open');
        $('div#group-info-box').removeClass('hide');
        $.each($(this).siblings('div.expander'), function(i, element) {
            if ($(element).children('.expander-arrow').attr('data-state') === "open") {
                $(element).removeClass('open');
                $(element).children('.expander-arrow').removeClass('arrow_carrot-down').addClass('arrow_carrot-right').attr('data-state', 'closed');
            }
        });
    } else {
        $(this).removeClass('open');
        $(this).children('.expander-arrow').removeClass('arrow_carrot-down').addClass('arrow_carrot-right').attr('data-state', 'closed');
        $('div#group-info-box').addClass('hide');
    }
}).on('mouseover', 'span.group-legend-entry', function() {
    var hover_group = $(this).text();
    $('p.victim-group[data-group="' + hover_group + '"]').addClass('horshack');
}).on('mouseout', 'span.group-legend-entry', function() {
    var hover_group = $(this).text();
    $('p.victim-group[data-group="' + hover_group + '"]').removeClass('horshack');
});


$('body').on('click', 'div.alert-box', function() {
    var alert_box = $(this);
    alert_box.addClass('transparent');
    setTimeout(function() {
        alert_box.remove();
    }, 250);
}).on('click', 'div.info-box', function() {
    var info_box = $(this);
    info_box.addClass('transparent');
    setTimeout(function() {
        info_box.remove();
    }, 250);
});

$('#group-info-box-head').on('click', 'button#edit-group-info', function() {
    target_group = $(this).attr('data-target');
    $('span#edit-group-info-title-name').text(target_group);
    $('input#edit-group-id').attr('value', oncalendar.oncall_groups[target_group].id);
    $('input#edit-group-name').attr('value', oncalendar.oncall_groups[target_group].name);
    $('input#edit-group-auth-group').attr('value', oncalendar.oncall_groups[target_group].auth_group)
    $('button#edit-group-turnover-day-label').empty()
        .append(oc.day_strings[oncalendar.oncall_groups[target_group].turnover_day] +
        '<span class="elegant_icons arrow_carrot-down"></span>');
    $('input#edit-group-turnover-day').attr('value', oncalendar.oncall_groups[target_group].turnover_day);
    $('button#edit-group-turnover-hour-label').text(oncalendar.oncall_groups[target_group].turnover_hour + ' ').append('<span class="elegant_icons arrow_carrot-down"></span>');
    $('input#edit-group-turnover-hour').attr('value', oncalendar.oncall_groups[target_group].turnover_hour);
    $('button#edit-group-turnover-min-label').text(oncalendar.oncall_groups[target_group].turnover_min + ' ').append('<span class="elegant_icons arrow_carrot-down"></span>');
    $('input#edit-group-turnover-min').attr('value', oncalendar.oncall_groups[target_group].turnover_min);
    if (oncalendar.oncall_groups[target_group].shadow) {
        $('button#edit-group-shadow-checkbox').removeClass('icon_box-empty').addClass('icon_box-checked').attr('data-checked', 'yes');
        $('input#edit-group-shadow').attr('value', 1);
    } else {
        $('button#edit-group-shadow-checkbox').removeClass('icon_box-checked').addClass('icon_box-empty').attr('data-checked', 'no');
        $('input#edit-group-shadow').attr('value', 0);
    }
    $('input#edit-group-email').attr('value', oncalendar.oncall_groups[target_group].email);
    $('input#edit-group-alias').attr('value', oncalendar.oncall_groups[target_group].alias);
    if (oncalendar.oncall_groups[target_group].backup) {
        $('input#edit-group-backup-alias').attr('value', oncalendar.oncall_groups[target_group].backup_alias).attr('readonly', false);
        $('button#edit-group-backup-checkbox').removeClass('icon_box-empty').addClass('icon_box-checked').attr('data-checked', 'yes');
        $('input#edit-group-backup').attr('value', 1);
    } else {
        backup_placeholder  = oncalendar.oncall_groups[target_group].backup_alias ? oncalendar.oncall_groups[target_group].backup_alias : 'Not Enabled';
        $('input#edit-group-backup-alias').attr('value', '').attr('placeholder', backup_placeholder).attr('readonly', true);
        $('button#edit-group-backup-checkbox').removeClass('icon_box-checked').addClass('icon_box-empty').attr('data-checked', 'no');
        $('input#edit-group-backup').attr('value', 0);
    }
    if (oncalendar.oncall_groups[target_group].failsafe) {
        $('input#edit-group-failsafe-alias').attr('value', oncalendar.oncall_groups[target_group].failsafe_alias).attr('readonly', false);
        $('button#edit-group-failsafe-checkbox').removeClass('icon_box-empty').addClass('icon_box-checked').attr('data-checked', 'yes');
        $('input#edit-group-failsafe').attr('value', 1);
    } else {
        failsafe_placeholder = oncalendar.oncall_groups[target_group].failsafe_alias ? oncalendar.oncall_groups[target_group].failsafe_alias : 'Not Enabled';
        $('input#edit-group-failsafe-alias').attr('value', '').attr('placeholder', failsafe_placeholder).attr('readonly', true);
        $('button#edit-group-failsafe-checkbox').removeClass('icon_box-checked').addClass('icon_box-empty').attr('data-checked', 'no');
        $('input#edit-group-failsafe').attr('value', 0);
    }
    $.magnificPopup.open({
        items: {
            src: '#edit-group-popup',
            type: 'inline'
        },
        preloader: false,
        removalDelay: 300,
        mainClass: 'popup-animate',
        callbacks: {
            close: function() {
				$('input#edit-group-email').removeClass('missing-input');
				$('span#edit-group-info-title-name').text('');
            }
        }
	});
});

$('#group-info-box-info').on('click', 'button#edit-members', function() {
    target_group = $(this).attr('data-target');
    $('span#edit-group-victims-title-name').text(target_group);
    victims = oncalendar.oncall_groups[target_group].victims;
    victims_table = $('table#group-victims-list-table');

    $.magnificPopup.open({
        items: {
            src: '#edit-group-victims-popup',
            type: 'inline'
        },
        preloader: false,
        removalDelay: 300,
        mainClass: 'popup-animate',
        callbacks: {
            close: function() {
                $('span#edit-group-victims-title-name').text('');
                $('tr.victim-row').remove();
                $('tr#edit-victims-form-buttons').remove();
                $('tr#victim-table-divider').remove();
            }
        }
    });

    victims_table.append('<tr id="victim-table-divider">' +
        '<td colspan="8" style="padding: 0; border-bottom: 1px solid #000;">' +
        '<input type="hidden" id="target-groupid" name="target-groupid" value="' + oncalendar.oncall_groups[target_group].id + '"></td></tr>');
    $.each(oncalendar.oncall_groups[target_group].victims, function(id, victim) {
        victims_table.append('<tr id="victim' + id + '" class="victim-row" data-victim-id="' + id + '"></tr>');
        victim_row = $('tr#victim' + id);
        victim_row.append('<td><button class="delete-group-victim-button button elegant_icons icon_minus_alt2" ' +
            'data-target="victim' + id + '-active"></button>' +
            '<input type="hidden" id="target-victim' + id + '" name="target-victim' + id + '" value="no"></td>' +
            '<td><button id="victim' + id + '-active-checkbox" class="group-victim-active-status oc-checkbox elegant_icons icon_box-empty"' +
            ' data-target="victim' +  id + '-active" data-checked="no"></button>' +
            '<input type="hidden" id="victim' + id + '-active" name="victim' + id + '-active" value="no"></td>');
        if (victim.group_active) {
            $('#victim' + id + '-active-checkbox').removeClass('icon_box-empty').addClass('icon_box-checked').attr('data-checked', 'yes');
            $('input#victim' + id + '-active').attr('value', 'yes');
        }
        victim_row.append('<td>' + victim.username + '</td>' +
                '<td>' + victim.firstname + '</td>' +
                '<td>' + victim.lastname + '</td>' +
                '<td>' + victim.phone + '</td>' +
                '<td>' + victim.email + '</td>' +
                '<td>' + victim.sms_email + '</td><td></td>'
        );
    });

    victims_table.append('<tr id="edit-victims-form-buttons">' +
        '<td colspan="5"></td>' +
        '<td><button id="edit-group-victims-cancel">Cancel</button></td>' +
        '<td><button id="edit-group-victims-save">Save Changes</button></td></tr>');

}).on('click', 'button#edit-month-button', function() {
    var edit_group = $(this).attr('data-target');
    if (oncalendar.oncall_groups[edit_group].active_victims.length === 0) {
        $('#group-info-box').prepend('<div class="alert-box">Please add users to the group before attempting to create a schedule.</div>');
    } else {
        window.location.href='/edit/month/' + edit_group + '/' + oncalendar.current_year + '/' + oncalendar.real_month;
    }
}).on('click', 'button#edit-by-week-button', function() {
    var edit_group = $(this).attr('data-target');
    if (oncalendar.oncall_groups[edit_group].active_victims.length === 0) {
        $('#group-info-box').prepend('<div class="alert-box">Please add users to the group before attempting to create a schedule.</div>');
    } else {
        window.location.href='/edit/weekly/' + edit_group + '/' + oncalendar.current_year + '/' + oncalendar.real_month;
    }
}).on('click', 'button#toggle-group-button', function() {
    var target_group = $(this).attr('data-target');
    var state = $(this).attr('data-state');
    if (state === "on") {
        $.each($('p.victim-group'), function(i, element) {
            if ($(element).attr('data-group') === target_group) {
                $(element).addClass('hide');
            }
        });
        $(this).text('Show This Group').attr('data-state', 'off');
        sessionStorage[target_group] = 'off';
    } else {
        $.each($('p.victim-group'), function(i, element) {
            if ($(element).attr('data-group') === target_group) {
                $(element).removeClass('hide');
            }
        });
        $(this).text('Hide This Group').attr('data-state', 'on');
        sessionStorage[target_group] = 'on';
    }
}).on('click', 'button#hide-others-button', function() {
    var target_group = $(this).attr('data-target');
    $('button#toggle-group-button').text('Hide This Group').attr('data-state', 'on');
    $.each($('p.victim-group'), function(i, element) {
        if ($(element).attr('data-group') === target_group) {
            $(element).removeClass('hide');
            sessionStorage[target_group] = 'on';
        } else {
            $(element).addClass('hide');
            sessionStorage[$(element).attr('data-group')] = 'off';
        }
    });
}).on('click', 'button#show-all-victims-button', function() {
    $('p.victim-group').removeClass('hide');
    $.each(Object.keys(oncalendar.oncall_groups), function(i, group) {
        sessionStorage[group] = 'on';
    });
}).on('click', 'button#page-oncall-button', function() {
	target_group = $(this).attr('data-target');
    $('input#oncall-page-originator').attr('value', current_user.username);
    $('input#oncall-page-group').attr('value', target_group);
    $('span#page-primary-groupname').text(target_group);

    $.magnificPopup.open({
        items: {
            src: '#send-oncall-page-popup',
            type: 'inline'
        },
        preloader: false,
        removalDelay: 300,
        mainClass: 'popup-animate',
        callbacks: {
            open: function() {
                setTimeout(function() {
                    $('textarea#page-primary-body').focus();
                }, 100);
            },
            close: function() {
                $('input#oncall-page-originator').removeAttr('value');
                $('input#oncall-page-group').removeAttr('value');
                $('span#page-primary-groupname').empty();
                $('textarea#page-primary-body').prop('value', '');
            }
        }
    });

}).on('click', 'button#panic-page-group-button', function() {
    target_group = $(this).attr('data-target');
    $('input#panic-page-originator').attr('value', current_user.username);
    $('input#panic-page-group').attr('value', target_group);
    $('span#panic-page-groupname').text(target_group);

    $.magnificPopup.open({
        items: {
            src: '#send-panic-page-popup',
            type: 'inline'
        },
        preloader: false,
        removalDelay: 300,
        mainClass: 'popup-animate',
        callbacks: {
            open: function() {
                setTimeout(function() {
                    $('textarea#panic-page-body').focus();
                }, 100);
            },
            close: function() {
                $('input#panic-page-originator').removeAttr('value');
                $('input#panic-page-group').removeAttr('value');
                $('span#panic-page-groupname').empty();
                $('textarea#panic-page-body').prop('value', '');
            }
        }
    });
});

$('#send-oncall-page-popup').on('click', 'button#cancel-oncall-page-button', function() {
    $.magnificPopup.close();
}).on('click', 'button#send-oncall-page-button', function() {
	var group = $('input#oncall-page-group').val();
    var sender = $('input#oncall-page-originator').val();
    var message_text = $('textarea#page-primary-body').val();
    $.when(oncalendar.send_oncall_sms(group, sender, message_text)).then(
        function(data) {
            $.magnificPopup.close();
            $('#group-info-box').prepend('<div class="info-box">Your page has been sent.</div>');
        },
        function(data) {
            $.magnificPopup.close();
            $('#group-info-box').prepend('<div class="alert-box">Failure to page oncall: ' + data + '</div>');
        }
    );
});

$('#send-panic-page-popup').on('click', 'button#cancel-panic-page-button', function() {
    $.magnificPopup.close();
}).on('click', 'button#send-panic-page-button', function() {
    var group = $('input#panic-page-group').val();
    var sender = $('input#panic-page-originator').val();
    var message_text = $('textarea#panic-page-body').val();
    $.when(oncalendar.send_panic_sms(group, sender, message_text)).then(
        function(data) {
            $.magnificPopup.close();
            $('#group-info-box').prepend('<div class="info-box">Your page has been sent.</div>');
        },
        function(data) {
            $.magnificPopup.close();
            $('group-info-box').prepend('<div class="alert-box">Failure to send panic page: ' + data + '</div>');
        }
    );
});

$('#edit-group-turnover-day-options').on('click', 'span', function() {
    $('#edit-group-turnover-day-label').text(oc.day_strings[$(this).attr('data-day')]).append(' <span class="elegant_icons arrow_carrot-down">');
    $('input#edit-group-turnover-day').attr('value', $(this).attr('data-day'));
});
$('#edit-group-turnover-hour-options').on('click', 'span', function() {
    $('#edit-group-turnover-hour-label').text($(this).attr('data-hour')).append(' <span class="elegant_icons arrow_carrot-down">');
    $('input#edit-group-turnover-hour').attr('value', $(this).attr('data-hour'));
});
$('#edit-group-turnover-min-options').on('click', 'span', function() {
    $('#edit-group-turnover-min-label').text($(this).attr('data-min')).append(' <span class="elegant_icons arrow_carrot-down">');
    $('input#edit-group-turnover-min').attr('value', $(this).attr('data-min'));
});

$('.oncalendar-edit-popup').on('click', 'button.oc-checkbox', function() {
    if ($(this).attr('data-checked') === "no") {
        $(this).removeClass('icon_box-empty').addClass('icon_box-checked').attr('data-checked', 'yes');
        $('input#' + $(this).attr('data-target')).attr('value', 1);
    } else {
        $(this).removeClass('icon_box-checked').addClass('icon_box-empty').attr('data-checked', 'no');
        $('input#' + $(this).attr('data-target')).attr('value', 0);
    }
}).on('click', 'span.oc-radio', function() {
    if ($(this).attr('data-checked') === 'no') {
        $(this).removeClass('icon_circle-empty').addClass('icon_circle-selected').attr('data-checked', 'yes');
        $('input#' + $(this).attr('data-target')).attr('value', 1);
        $.each($(this).siblings('span.oc-radio'), function(i, radio) {
            $(radio).removeClass('icon_circle-selected').addClass('icon_circle-empty').attr('data-checked', 'no');
            $('input#' + $(radio).attr('data-target')).attr('value', 0);
        })
    } else {
        $(this).removeClass('icon_circle-selected').addClass('icon_circle-empty').attr('data-checked', 'no');
        $('input#' + $(this).attr('data-target')).attr('value', 0);
    }
});

$('#edit-group-popup').on('click', 'button#edit-group-cancel-button', function() {
    $.magnificPopup.close();
}).on('click', 'button#edit-group-save-button', function() {
	if ($('input#edit-group-name').val().length == 0) {
        $('input#edit-group-name').addClass('missing-input').focus();
    } else if (! valid_email($('input#edit-group-email').val())) {
		$('input#edit-group-email').addClass('missing-input');
	} else {
        var group_data = {
            id: $('input#edit-group-id').val(),
            name: $('input#edit-group-name').val(),
            email: $('input#edit-group-email').val(),
            turnover_day: $('input#edit-group-turnover-day').val(),
            turnover_hour: $('input#edit-group-turnover-hour').val(),
            turnover_min: $('input#edit-group-turnover-min').val(),
            shadow: $('input#edit-group-shadow').val(),
            backup: $('input#edit-group-backup').val()
        };
        if (email_gateway_config) {
            group_data.failsafe = $('input#edit-group-failsafe').val();
            group_data.alias = $('input#edit-group-alias').val();
            group_data.backup_alias = $('input#edit-group-backup-alias').val();
            group_data.failsafe_alias = $('input#edit-group-failsafe-alias').val();
        }
	    $.when(oncalendar.update_group(group_data)).then(
	        function(data) {
	            if (data.turnover_hour < 10) {
	                data.turnover_hour = '0' + data.turnover_hour;
	            }
	            if (data.turnover_min < 10) {
	                data.turnover_min = '0' + data.turnover_min;
	            }
	            data.turnover_time = [data.turnover_hour, data.turnover_min].join(':');
	            data.victims = oncalendar.oncall_groups[data.name].victims;
	            oncalendar.oncall_groups[data.name] = data;
	            populate_group_info(data.name);
	            $.magnificPopup.close();
				$('div#group-info-box').prepend('<div class="info-box">Changes have been saved</div>');
	        },
	        function(data) {
	            $('div#edit-group-popup').prepend('<div class="alert-box">Update failed: ' + data[1] + '</div>');
	        }
	    );
	}

});

$('#edit-group-victims-popup').on('click', 'button.delete-group-victim-button', function() {
    var target_victim = $(this).attr('data-target');
    if ($(this).siblings('input').val() === "no") {
        $(this).siblings('input').val('yes');
        $(this).parents('td').parents('tr').addClass('strikethrough');
    } else {
        $(this).siblings('input').val('no');
        $(this).parents('td').parents('tr').removeClass('strikethrough');
    }
}).on('click', 'button.group-victim-active-status', function() {
    if ($(this).hasClass('icon_box-empty')) {
        $(this).removeClass('icon_box-empty').addClass('icon_box-checked').attr('data-checked', 'yes');
        $(this).siblings('input').val('yes');
    } else {
        $(this).removeClass('icon_box-checked').addClass('icon_box-empty').attr('data-checked', 'no');
        $(this).siblings('input').val('no');
    }
}).on('click', 'button#edit-group-victims-cancel', function() {
    $.magnificPopup.close();
}).on('blur', 'input#add-victim-username', function() {
    if ($('input#add-victim-email').val().length < 9) {
		$('input#add-victim-email').val($(this).val() + '@box.com');
	}
}).on('click', 'button#add-new-victim-save-button', function() {
    var victim_data = {
		victim_id: $('input#victim-id').val(),
        username: $('input#add-victim-username').val(),
        firstname: $('input#add-victim-firstname').val(),
        lastname: $('input#add-victim-lastname').val(),
        phone: $('input#add-victim-phone').val(),
        email: $('input#add-victim-email').val(),
        sms_email: $('input#add-victim-sms-email').val(),
        active: 1,
        app_role: 0,
        groups: [$('input#target-groupid').val()]
    };

    victim_data.phone = victim_data.phone.replace(/\D/g,'');
    var country_code = victim_data.phone.substring(0,1);
    if (country_code !== "1") {
        victim_data.phone = "1" + victim_data.phone
    }
    if (victim_data.phone.length !== 11) {
        $('input#add-victim-phone').val(victim_data.phone).css('border', '1px solid red');
    } else {
		if (victim_data.victim_id > 0) {
			victim_changes = {}
			victim_changes.victims = []
			victim_changes.groupid = $('input#target-groupid').val();
			victim_changes.victims.push({victimid: victim_data.victim_id, remove: 0, active: 1})
			console.log(victim_changes)
			$.when(oncalendar.update_victim_status(victim_changes)).then(function(data) {
				console.log(data);
				var id = victim_data.victim_id;
				$('input#victim-id').removeProp('value').val('0');
				$('input#add-victim-username').removeProp('value').val('');
				$('input#add-victim-firstname').removeProp('value').val('');
				$('input#add-victim-lastname').removeProp('value').val('');
				$('input#add-victim-phone').removeProp('value').val('');
				$('input#add-victim-email').removeProp('value').val('');
				$('input#add-victim-sms-email').removeProp('value').val('');
                $('table#group-victims-list-table').children('tbody').children('tr#edit-victims-form-buttons')
                    .before('<tr id="victim' + id + '" class="victim-row" data-victim-id="' + id + '"></tr>');
                var victim_row = $('tr#victim' + id);
                victim_row.append('<td><button class="delete-group-victim-button button elegant_icons icon_minus_alt2" ' +
                    'data-target="victim' + id + '-active"></button>' +
                    '<input type="hidden" id="target-victim' + id + '" name="target-victim' + id + '" value="no"></td>' +
                    '<td><button id="victim' + id + '-active-checkbox" class="group-victim-active-status oc-checkbox elegant_icons icon_box-checked' +
                    ' data-target="victim' +  id + '-active" data-checked="yes"></button>' +
                    '<input type="hidden" id="victim' + id + '-active" name="victim' + id + '-active" value="yes"></td>');
                victim_row.append('<td>' + data[id].username + '</td>' +
                    '<td>' + data[id].firstname + '</td>' +
                    '<td>' + data[id].lastname + '</td>' +
                    '<td>' + data[id].phone + '</td>' +
                    '<td>' + data[id].email + '</td>' +
                    '<td>' + data[id].sms_email + '</td><td></td>'
                );
			});
        } else {
	        $.when(oncalendar.add_new_victim(victim_data)).then(function(data) {
				if (typeof data.api_error !== "undefined") {
					$('#edit-group-victims-popup').append('<div class="alert-box">User name/data conflict, please try again</div>');
				} else {
		            var id = data.id;
		            $('input#add-victim-username').val('');
		            $('input#add-victim-firstname').val('');
		            $('input#add-victim-lastname').val('');
		            $('input#add-victim-phone').val('');
		            $('input#add-victim-email').val('');
		            $('input#add-victim-sms-email').val('');
		            $('table#group-victims-list-table').children('tbody').children('tr#edit-victims-form-buttons')
		                .before('<tr id="victim' + id + '" class="victim-row" data-victim-id="' + id + '"></tr>');
		            var victim_row = $('tr#victim' + id);
		            victim_row.append('<td><button class="delete-group-victim-button button elegant_icons icon_minus_alt2" ' +
		                'data-target="victim' + id + '-active"></button>' +
		                '<input type="hidden" id="target-victim' + id + '" name="target-victim' + id + '" value="no"></td>' +
		                '<td><button id="victim' + id + '-active-checkbox" class="group-victim-active-status oc-checkbox elegant_icons icon_box-checked' +
		                ' data-target="victim' +  id + '-active" data-checked="yes"></button>' +
		                '<input type="hidden" id="victim' + id + '-active" name="victim' + id + '-active" value="yes"></td>');
		            victim_row.append('<td>' + data.username + '</td>' +
		                    '<td>' + data.firstname + '</td>' +
		                    '<td>' + data.lastname + '</td>' +
		                    '<td>' + data.phone + '</td>' +
		                    '<td>' + data.email + '</td>' +
		                    '<td>' + data.sms_email + '</td><td></td>'
		            );
				}
	        });
		}
    }

}).on('click', 'button#edit-group-victims-save', function() {
    var victim_changes = {};
    victim_changes.victims = [];
    victim_changes.groupid = $('input#target-groupid').val();
    $.each($('tr.victim-row'), function() {
        var victim_id = $(this).attr('data-victim-id');
		if ($('input#target-victim' + victim_id).val() === "no") {
	        var victim = {
	            victimid: victim_id,
	            active: $('input#victim' + victim_id + '-active').val() === "yes" ? 1 : 0
	        };
	        victim_changes.victims.push(victim);
		}
    });

    $.when(oncalendar.update_victim_status(victim_changes)).then(
        function(data) {
            var group_name = $('div#group-info-box-head').children('h2').text();
            oncalendar.oncall_groups[group_name].victims = data;
            populate_group_info(group_name);
			$('#group-info-box').prepend('<div class="info-box">Group member changes saved</div>');
            $.magnificPopup.close();
        },
		function(data) {
			$('#edit-group-victims-popup').prepend('<div class="alert-box">Unable to save changes: ' + data[1] +'</div>');
		}
    );
});

$('div#edit-account-info-popup').on('click', 'button.oc-checkbox', function() {
	console.log(this);
    if ($(this).attr('data-checked') === "no") {
        $(this).removeClass('icon_box-empty').addClass('icon_box-checked').attr('data-checked', 'yes');
        $('input#' + $(this).attr('data-target')).attr('value', 'yes');
    } else {
        $(this).removeClass('icon_box-checked').addClass('icon_box-empty').attr('data-checked', 'no');
        $('input#' + $(this).attr('data-target')).attr('value', 'no');
    }
}).on('click', 'button#edit-account-cancel-button', function() {
	$.magnificPopup.close();
}).on('click', 'button#edit-account-save-button', function() {
	var account_text_fields = [
		'firstname',
		'lastname',
		'phone'
	];
	var missing_input = 0;
	$.each(account_text_fields, function(i, field) {
		if ($('input#edit-account-' + field).val().length == 0) {
			$('input#edit-account-' + field).addClass('missing-input');
			missing_input++;
		}
	});
	victim_phone = $('input#edit-account-phone').val().replace(/\D/g,'');
    var country_code = victim_phone.substring(0,1);
    if (country_code !== "1") {
        victim_phone = "1" + victim_phone
    }
    if (victim_phone.length !== 11) {
        $('input#add-victim-phone').val(victim_phone).addClass('missing-input').focus();
		missing_input++;
	}

	var throttle_value = $('input#edit-account-throttle').val().replace(/\D/g,'');
	if (throttle_value.length == 0 || throttle_value < {{ throttle_min }}) {
		throttle_value = {{ throttle_min }};
		$('input#edit-account-throttle').val({{ throttle_min }});
	}

	if (missing_input == 0) {
		var victim_data = {
			username: current_user.username,
			firstname: $('input#edit-account-firstname').val(),
			lastname: $('input#edit-account-lastname').val(),
			phone: $('input#edit-account-phone').val(),
			sms_email: $('input#edit-account-sms-email').val(),
			throttle: throttle_value,
			truncate: $('input#edit-account-truncate').val() === "yes" ? '1' : '0',
			groups: {}
		};
		$.each($('input.group-active-input'), function() {
			var victim_group = $(this).attr('data-group');
			victim_data.groups[victim_group] = $(this).val() === "yes" ? '1' : '0';
		});

		$.when(oncalendar.update_victim_info(current_user.id, victim_data)).then(
			// done: update current_user and the victim record on oncalendar.oncall_groups
			function(data) {
				current_user = data;
				var current_user_groups = data.groups;
				delete(data.groups);
				console.log('user groups: ' + JSON.stringify(current_user_groups));
				$.each(current_user_groups, function(group, status) {
					oncalendar.oncall_groups[group].victims[current_user.id] = data;
					oncalendar.oncall_groups[group].victims[current_user.id].group_active = status;
				});
			},
			// fail: show error message
			function(status) {
				$('div#page-head').append('<div class="alert-box">' + status + '</div>');
			}
		);
		$.magnificPopup.close();

	}
});


$('div#edit-day-popup').on('click', 'span.slot-item', function() {
    var new_victim = $(this).attr('data-target');
    $(this).parents('ul').siblings('span').children('button').text(new_victim).attr('data-target', new_victim);
}).on('click', 'button#edit-day-cancel-button', function() {
    $.magnificPopup.close();
}).on('click', 'button#edit-day-save-button', function() {
	var reason_for_edit = $('textarea#edit-day-note').val();
	if (reason_for_edit.length < 3) {
		$('textarea#edit-day-note').addClass('missing-input').focus();
	} else {
        $('div#edit-day-popup').append('<div id="popup-working"><span id="status-message"><h3>Working...</h3></span></div>');
	    var update_day_data = {
	        calday: $(this).attr('data-calday'),
	        cal_date: $(this).attr('data-date'),
	        group: $(this).attr('data-group'),
			note: reason_for_edit,
	        slots: {}
	    };

	    $.each($('button.edit-day-oncall-button'), function() {
	        if (typeof $(this).attr('data-target') !== "undefined") {
	            update_day_data.slots[$(this).attr('data-slot')] = {
	                oncall: $(this).attr('data-target')
	            }
	        }
	    });
	    $.each($('button.edit-day-shadow-button'), function() {
	        if (typeof $(this).attr('data-target') !== "undefined") {
	            if (typeof update_day_data.slots[$(this).attr('data-slot')] !== "undefined") {
	                update_day_data.slots[$(this).attr('data-slot')].shadow = $(this).attr('data-target');
	            } else {
	                update_day_data.slots[$(this).attr('data-slot')] = {
	                    shadow: $(this).attr('data-target')
	                }
	            }
	        }
	    });
		$.each($('button.edit-day-backup-button'), function() {
			if (typeof $(this).attr('data-target') !== "undefined") {
				if (typeof update_day_data.slots[$(this).attr('data-slot')] !== "undefined") {
					update_day_data.slots[$(this).attr('data-slot')].backup = $(this).attr('data-target');
				} else {
					update_day_data.slots[$(this).attr('data-slot')] = {
						backup: $(this).attr('data-target')
					}
				}
			}
		});

	    $.when(oncalendar.update_day(update_day_data)).then(
	        function(data) {
		        $('div#popup-working').children('span').children('h3').text('Update Complete');
	            var slots = data;
	            var date_bits = update_day_data.cal_date.split('-');
	            var date_object = new Date(date_bits[0], date_bits[1], date_bits[2]).addMonths(-1);
	            var current_victim = {};
	            var p_group_class = {};
	            $.each(oncalendar.oncall_groups, function(group, data) {
	                if (typeof sessionStorage[group] === "undefined") {
	                    sessionStorage[group] = 'on';
	                }
	                if (sessionStorage[group] === "off") {
	                    p_group_class[group] = "victim-group info-tooltip hide";
	                } else {
	                    p_group_class[group] = "victim-group info-tooltip";
	                }
	            });

	            $.each(slots, function(slot, slot_data) {
	                oncalendar.victims[update_day_data.calday].slots[slot][update_day_data.group] = slot_data;
	            });
	            $('td#' + update_day_data.cal_date).children('div.calendar-day-victims').empty();
	            $.each(Object.keys(oncalendar.victims[update_day_data.calday].slots).sort(), function(i, slot) {
	                slot_groups = oncalendar.victims[update_day_data.calday].slots[slot];
	                $.each(slot_groups, function(group, victims) {
	                    if (typeof current_victim[group] === "undefined") {
	                        current_victim[group] = {
	                            oncall: null,
	                            shadow: null,
								backup: null
	                        }
	                    }
	                    if ((date_object.getDay() === oncalendar.oncall_groups[group].turnover_day && slot === oncalendar.oncall_groups[group].turnover_string) || slot === "00-00") {
	                        if (victims.oncall !== current_victim[group].oncall) {
	                            current_victim[group].oncall = victims.oncall;
	                            current_victim[group].oncall_name = victims.oncall_name;
	                        }
	                        $('td#' + update_day_data.cal_date).children('div.calendar-day-victims')
	                            .append('<p class="' + p_group_class[group] + '" data-group="' + group + '" title="' + group +
	                                ' - ' + current_victim[group].oncall_name + '" style="color: ' +
	                                oncalendar.group_color_map[group] + ';">' + slot.replace('-', ':') + ' ' +
	                                current_victim[group].oncall + '</p>');
							if (victims.shadow != null) {
								if (victims.shadow !== current_victim[group].shadow) {
									current_victim[group].shadow = victims.shadow;
									current_victim[group].shadow_name = victims.shadow_name;
								}
								$('td#' + update_day_data.cal_date).children('div.calendar-day-victims')
									.append('<p class="' + p_group_class[group] + '" data-group="' + group + '" title="' + group +
									' - ' + current_victim[group].shadow_name + '" style="color: ' +
									oncalendar.group_color_map[group] + ';">' + slot.replace('-', ':') + ' ' +
									current_victim[group].shadow + ' (S)</p>');
							}
							if (victims.backup != null) {
								if (victims.backup !== current_victim[group].backup) {
									current_victim[group].backup = victims.backup;
									current_victim[group].backup_name = victims.backup_name;
								}
								$('td#' + update_day_data.cal_date).children('div.calendar-day-victims')
									.append('<p class="' + p_group_class[group] + '" data-group="' + group + '" title="' + group +
									' - ' + current_victim[group].backup_name + '" style="color: ' +
									oncalendar.group_color_map[group] + ';">' + slot.replace('-', ':') + ' ' +
									current_victim[group].backup + ' (B)</p>');
							}
	                    } else {
							if (victims.oncall !== current_victim[group].oncall) {
		                        current_victim[group].oncall = victims.oncall;
		                        current_victim[group].oncall_name = victims.oncall_name;
		                        $('td#' + update_day_data.cal_date).children('div.calendar-day-victims')
		                            .append('<p class="' + p_group_class[group] +'" data-group="' + group + '" title="' + group +
	                                ' - ' + current_victim[group].oncall_name + '" style="color: ' +
	                                oncalendar.group_color_map[group] + ';">' + slot.replace('-', ':') + ' ' +
	                                current_victim[group].oncall + '</p>');
							}
							if (victims.shadow !== current_victim[group].shadow) {
								current_victim[group].shadow = victims.shadow;
								current_victim[group].shadow_name = victims.shadow_name;
								$('td#' + update_day_data.cal_date).children('div.calendar-day-victims')
									.append('<p class="' + p_group_class[group] + '" data-group="' + group + '" title="' + group +
									' - ' + current_victim[group].shadow_name + '" style="color: ' +
									oncalendar.group_color_map[group] + ';">' + slot.replace('-', ':') + ' ' +
									current_victim[group].shadow + ' (S)</p>');
							}
							if (victims.backup !== current_victim[group].backup) {
								current_victim[group].backup = victims.backup;
								current_victim[group].backup_name = victims.backup_name;
								$('td#' + update_day_data.cal_date).children('div.calendar-day-victims')
									.append('<p class="' + p_group_class[group] + '" data-group="' + group + '" title="' + group +
									' - ' + current_victim[group].backup_name + '" style="color: ' +
									oncalendar.group_color_map[group] + ';">' + slot.replace('-', ':') + ' ' +
									current_victim[group].backup + ' (B)</p>');
							}
	                    }
	                });
	            });
	            $('p.victim-group.info-tooltip').tooltip({placement: 'top', delay: {show: 500, hide: 100}});
	            setTimeout(function() {
		            $.magnificPopup.close();
                }, 500);
				setTimeout(function() {
					$('div#popup-working').remove();
				}, 1000);
	        }
	    );
	}

});

$('table#calendar-table').on('mouseenter', 'td.calendar-day', function() {
    if ($(this).children('span.edit-day-menu').hasClass('hide')) {
        if (current_user.app_role === 2) {
            $(this).children('span.edit-day-menu').addClass('dropdown').removeClass('hide')
                .append('<span data-toggle="dropdown">' +
                    '<button id="edit-day-menu-button"><span class="elegant_icons icon_pencil-edit"></span></button></span>')
                .append('<ul id="edit-day-group-options" class="dropdown-menu" role="menu"></ul>');
            $.each(Object.keys(oncalendar.oncall_groups), function (i, group) {
                $('ul#edit-day-group-options').append('<li><span class="edit-day-group-item" data-target="' + group + '">Edit day: ' + group + '</span></li>');
            });
        } else if (Object.keys(current_user.groups).length > 1) {
            $(this).children('span.edit-day-menu').addClass('dropdown').removeClass('hide')
                .append('<span data-toggle="dropdown">' +
                    '<button id="edit-day-menu-button"><span class="elegant_icons icon_pencil-edit"></span></button></span>')
                .append('<ul id="edit-day-group-options" class="dropdown-menu" role="menu"></ul>');
            $.each(current_user.groups, function (group, active) {
                $('ul#edit-day-group-options').append('<li><span class="edit-day-group-item" data-target="' + group + '">Edit day: ' + group + '</span></li>');
            });
        } else if (Object.keys(current_user.groups).length == 1) {
            $(this).children('span.edit-day-menu').removeClass('hide')
                .append('<button id="edit-day-button" data-target="' + Object.keys(current_user.groups)[0] + '">' +
                    '<span class="elegant_icons icon_pencil-edit"></span></button>');
        }
    }
}).on('mouseleave', 'td.calendar-day', function() {
    $(this).children('span.edit-day-menu').empty().addClass('hide');
}).on('click', 'button#edit-day-button', function() {
    var target_group = $(this).attr('data-target');
    var calday = $(this).parents('span').attr('data-calday');
    var cal_date = $(this).parents('span').parents('td').attr('id');
    edit_calday(target_group, calday, cal_date);
}).on('click', 'span.edit-day-group-item', function() {
    var target_group = $(this).attr('data-target');
    var calday = $(this).parents('li').parents('ul').parents('span.edit-day-menu').attr('data-calday');
    var cal_date = $(this).parents('li').parents('ul').parents('span.edit-day-menu').parents('td').attr('id');
    edit_calday(target_group, calday, cal_date);
});

{% endblock %}