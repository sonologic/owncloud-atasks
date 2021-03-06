OC.ATasks = {
	bool_string_cmp:function(a, b) {
		if (a === b) {
			return 0;
		}
		if (a === false) {
			return -1;
		}
		if (b === false) {
			return 1;
		}
		return a.localeCompare(b);
	},
	create_task_div:function(task) {
		var actions = $('#task_actions_template');
		var summary_container = $('<p class="summary">')
				.attr('title', task.description)
				;
		OC.ATasks.setSummary(summary_container, task);
		var task_container = $('<div>')
			.addClass('task')
			.data('task', task)
			.data('show_count', 0)
			.attr('data-id', task.id)
			.append(summary_container)
			.append(actions.clone().removeAttr('id'))
			;
		task_container.find('.summary a').click(OC.ATasks.summaryClickHandler);
		var checkbox = $('<input type="checkbox">')
			.click(OC.ATasks.complete_task);
		if (task.completed) {
			checkbox.attr('checked', 'checked');
			task_container.addClass('done');
		}
		$('<div>')
			.addClass('completed')
			.append(checkbox)
			.prependTo(task_container);
		var priority = task.priority;
		$('<div>')
			.addClass('tag')
			.addClass('priority')
			.addClass('priority-'+(priority?priority:'n'))
			.text(priority)
			.prependTo(task_container);
		if (task.location) {
			$('<div>')
				.addClass('tag')
				.addClass('location')
				.text(task.location)
				.appendTo(task_container);
		}
		var $categories = $('<div>')
				.addClass('categories')
				.appendTo(task_container);
		$(task.categories).each(function(i, category){
				$categories.append($('<a>')
					.addClass('tag')
					.text(category)
				);
		});
		var $calendar = $('<div>')
				.addClass('calendar')
				.appendTo(task_container);
		$calendar.text(task['calendar']);
		task_container.find('.task_more').click(OC.ATasks.moreClickHandler);
		task_container.find('.task_less').click(OC.ATasks.lessClickHandler);
		var description = $('<textarea>')
			.addClass('description')
			.blur(function(){
				var task = $(this).closest('.task').data('task');
				var description = $(this).val();
				$.post(OC.filePath('atasks', 'ajax', 'update_property.php'), {id:task.id, type:'description', description:description}, function(jsondata){
					if(jsondata.status == 'success') {
						task.description = description;
					}
				});
			})
			.text(task.description);
		var due = $('<span>')
			.addClass('due')
			.append(t('tasks', 'Due'));
		due
			.append($('<input type="date">')
					.addClass('date')
					.datepicker({
						dateFormat: 'dd-mm-yy',
						onClose: OC.ATasks.dueUpdateHandler
					}),
				$('<input type="time">')
					.addClass('time')
					.timepicker({
						showPeriodLabels:false,
						onClose: OC.ATasks.dueUpdateHandler
					})
			);
		if (task.due){
			var date = new Date(parseInt(task.due)*1000);
			due.find('.date').datepicker('setDate', date);
			if (!task.due_date_only) {
				due.find('.time').timepicker('setTime', date.getHours()+':'+date.getMinutes());
			}
		}
		var delete_action = task_container.find('.task_delete').click(OC.ATasks.deleteClickHandler);
		$('<div>')
			.addClass('more')
			.append(delete_action)
			.append(description)
			.append(due)
			.appendTo(task_container);
		$('<input placeholder="'+t('tasks', 'List')+'">')
			.addClass('categories')
			.multiple_autocomplete({source: categories})
			.val(task.categories)
			.blur(function(){
				var task = $(this).closest('.task').data('task');
				var categories = $(this).val();
				$.post(OC.filePath('atasks', 'ajax', 'update_property.php'), {id:task.id, type:'categories', categories:categories}, function(jsondata){
					if(jsondata.status == 'success') {
						task.categories = categories.split(',');
						$categories.empty();
						$(task.categories).each(function(i, category){
							$categories.append($('<a>')
								.addClass('tag')
								.text(category)
								);
							});
					}
				});
			})
			.appendTo(task_container);
		$('<input placeholder="'+t('tasks', 'Location')+'">')
			.addClass('location')
			.val(task.location)
			.blur(function(){
				var task = $(this).closest('.task').data('task');
				var location = $(this).val();
				$.post(OC.filePath('atasks', 'ajax', 'update_property.php'), {id:task.id, type:'location', location:location}, function(jsondata){
					if(jsondata.status == 'success') {
						task.location = location;
						task_container.find('.location').text(location);
					}
				});
			})
			.appendTo(task_container);
		var calendarObject = OC.ATasks.getCalendarById(task.calendar);
		var calendarName = 'error';
		var calendarId = -1;
		if(calendarObject!=null) {
			calendarName=calendarObject.displayname;
			calendarId=calendarObject.id;
		}
		$('<select placeholder="'+t('tasks', 'Calendar')+'">')
			.addClass('calendar')
			.append('<option value="'+calendarId+'">'+calendarName+'</option>')
			.focusin(function() {
				var task = $(this).closest('.task').data('task');
				$(this).find('option').each(function() {
					if($(this).val()!=task.calendar)
						$(this).remove();
				});
				for(calendarIdx in calendars) {
					var calendar = calendars[calendarIdx];
					if(calendar.id!=task.calendar)
						$(this).append('<option value="'+calendar.id+'">'+calendar.displayname+'</option>');
				}
			})
			.change(function() {
				var task = $(this).closest('.task').data('task');
				var calendar = $(this).val();
				$.post(OC.filePath('atasks', 'ajax', 'update_property.php'), {id:task.id, type:'calendar', calendar:calendar}, function(jsondata){
					if(jsondata.status == 'success') {
						task.calendar = calendar;
						task_container.find('div.calendar').text(calendar);
						task_container.find('.task_less').click();
						task_container.hide();
					}
				});
			})
			.appendTo(task_container);

		return task_container;
	},
	filterText:function(text, find_filter) {
		var tag_text = text;
		OC.ATasks.filterUpdate(true, function(task_container){
			var found = 0;
			task_container.find(find_filter).each(function(){
				if ($(this).text() == tag_text) {
					$(this).removeClass('active');
					$(this).addClass('active');
					found = 1;
				}
			});
			return found;
		});
	},
	filter:function(tag, find_filter) {
		var tag_text = $(tag).text();
		OC.ATasks.filterText(tag_text, find_filter);
	},
	filterUpdate:function(filter, find_filter) {
		var show_count = $('#tasks_list').data('show_count');
		show_count += filter ? +1 : -1;
		$('#tasks_list').data('show_count', show_count);
		$('#tasks_lists .task, #tasks_list .task').each(function(i, task_container){
			task_container = $(task_container);
			var task = task_container.data('task');
			var found = find_filter(task_container);
			var hide_count = task_container.data('show_count');
			if (!filter) {
				hide_count-=found;
			}
			else {
				hide_count+=found;
			}
/*
			if (hide_count == show_count) {
				task_container.show();
			}
			else {
				task_container.hide();
			}
*/
			if(found) {
				task_container.show();
			} else {
				task_container.hide();
			}
			task_container.data('show_count', hide_count);
		});
	},
	order:function(sort, get_property, empty_label) {
		var tasks = $('#tasks_list .task').not('.clone');
		tasks.sort(sort);
		var current = null;
		tasks.detach();
		var $tasks = $('#tasks_list').empty();
		var container = $tasks;
		tasks.each(function(){
			if (get_property) {
				var label = get_property($(this).data('task'));
				if(label != current) {
					current = label;
					container = $('<div>').appendTo($tasks);
					if (label == '' && empty_label) {
						label = empty_label;
					}
					$('<h1>').text(label).appendTo(container);
				}
			}
			container.append(this);
		});
	},
	setSummary:function(summary_container, task){
		var task_summary = task.summary ?
			task.summary :
			task.description ?
				task.description.substr(0, 20) :
				'<no title>';
		var summary = $('<a href="index.php?id='+task.id+'">')
			.text(task_summary)
			.click(OC.ATasks.summaryClickHandler);
		summary_container.html(summary);
	},
	summaryClickHandler:function(event){
		event.preventDefault();
		//event.stopPropagation();
		var task = $(this).closest('.task').data('task');
		var summary_container = $(this).parent();
		var input = $('<input>').val($(this).text()).blur(function(){
			var old_summary = task.summary;
			task.summary = $(this).val();
			OC.ATasks.setSummary(summary_container, task);
			$.post(OC.filePath('atasks', 'ajax', 'update_property.php'), {id:task.id, type:'summary', summary:task.summary}, function(jsondata){
				if(jsondata.status != 'success') {
					task.summary = old_summary;
					OC.ATasks.setSummary(summary_container, task);
				}
			});
		});
		summary_container.empty().append(input);
		input.focus();
		return false;
	},
	dueUpdateHandler:function(){
		var task = $(this).closest('.task').data('task');
		var old_due = task.due;
		var $date = $(this).parent().children('.date');
		var $time = $(this).parent().children('.time');
		var date = $date.datepicker('getDate');
		var time = $time.val().split(':');
		var due, date_only = false;
		if (!date){
			due = false;
		} else {
			if (time.length==2){
				date.setHours(time[0]);
				date.setMinutes(time[1]);
			}
			else {
				date_only = true;
			}
			due = date.getTime()/1000;
		}
		$.post(OC.filePath('atasks', 'ajax', 'update_property.php'), {id:task.id, type:'due', due:due, date:date_only?1:0}, function(jsondata){
			if(jsondata.status != 'success') {
				task.due = old_due;
			}
		});
	},
	moreClickHandler:function(event){
		var $task = $(this).closest('.task'),
			task = $task.data('task');
		$task.find('.more').show();
		$task.find('.task_more').hide();
		$task.find('.task_less').show();
		$task.find('div.categories').hide();
		$task.find('input.categories').show();
		$task.find('div.location').hide();
		$task.find('input.location').show();
		$task.find('select.calendar').show();
	},
	lessClickHandler:function(event){
		var $task = $(this).closest('.task'),
			task = $task.data('task');
		$task.find('.more').hide();
		$task.find('.task_more').show();
		$task.find('.task_less').hide();
		$task.find('div.categories').show();
		$task.find('input.categories').hide();
		$task.find('div.location').show();
		$task.find('input.location').hide();
		$task.find('select.calendar').hide();
	},
	deleteClickHandler:function(event){
		var $task = $(this).closest('.task'),
			task = $task.data('task');
		$.post(OC.filePath('atasks', 'ajax', 'delete.php'),{'id':task.id},function(jsondata){
			if(jsondata.status == 'success'){
				$task.remove();
			}
			else{
				alert(jsondata.data.message);
			}
		});
		return false;
	},
	complete_task:function() {
		var $task = $(this).closest('.task'),
			task = $task.data('task'),
			checked = $(this).is(':checked');
		$.post(OC.filePath('atasks', 'ajax', 'update_property.php'), {id:task.id, type:'complete', checked:checked?1:0}, function(jsondata){
			if(jsondata.status == 'success') {
				task = jsondata.data;
				$task.data('task', task)
				if (task.completed) {
					$task.addClass('done');
				}
				else {
					$task.removeClass('done');
				}
			}
			else{
				alert(jsondata.data.message);
			}
		}, 'json');
	},
	categoriesChanged:function(newcategories){
		categories = $.map(newcategories, function(v) {return v;});
		console.log('Task categories changed to: ' + categories);
		$('input.categories').multiple_autocomplete('option', 'source', categories);
	},
	getCalendarById:function(id) {
		for(calendarIndex in calendars) {
			if(calendars[calendarIndex].id == id) {
				return calendars[calendarIndex];
			}
		}
		return null;
	},
	List: {
		create_list_div:function(category){
			return $('<div>').text(category)
				.click(function(){
					OC.ATasks.filter(this, 'div.categories .tag');
					$(this).toggleClass('active');
				});
		},
		create_cal_div:function(calendar){
			return $('<div id="cal-list-'+calendar['id']+'">').text(calendar['displayname'])
				.click(function(){
					var id = $(this).attr('id').substring(9);

					$('#tasks_lists div').removeClass('active');
					OC.ATasks.filterText(id, 'div.calendar');
					$("#tasks_lists").data('active_id',id);
					$(this).addClass('active');
				});
		}
	}
};

$(document).ready(function(){
	$(window).resize(function () {
		fillHeight($('#tasks_lists'));
		fillWindow($('#tasks_list'));
	});
	$(window).trigger('resize');

	/*-------------------------------------------------------------------------
	 * Actions for startup
	 *-----------------------------------------------------------------------*/
	$.getJSON(OC.filePath('atasks', 'ajax', 'gettasks.php'), function(jsondata) {
		var tasks = $('#tasks_list').empty().data('show_count', 0);
		$(jsondata).each(function(i, task) {
			tasks.append(OC.ATasks.create_task_div(task));
		});
		if( $('#tasks_list div').length > 0 ){
			$('#tasks_list div').first().addClass('active');
		}
		$.each(calendars, function(i, calendar) {
			OC.ATasks.List.create_cal_div(calendar).insertBefore('#tasks_lists .done');
		});
		$('#tasks_lists .done').click(function(){
			var filter = !$(this).hasClass('active');
			OC.ATasks.filterUpdate(filter, function(task_container){
				return task_container.hasClass('done');
			});
			$(this).toggleClass('active');
		});
		OCCategories.changed = OC.ATasks.categoriesChanged;
		OCCategories.app = 'calendar';
		$("#tasks_lists").children()[0].click();
	});

	/*-------------------------------------------------------------------------
	 * Event handlers
	 *-----------------------------------------------------------------------*/
	$('#tasks_list div.categories .tag').live('click',function(){
		OC.ATasks.filter(this, 'div.categories .tag');
		var tag_text = $(this).text();
		$('#tasks_lists div:not(".all"):not(".done")').each(function(){
			if ($(this).text() == tag_text) {
				$(this).toggleClass('active');
			}
		});
	});

	$('#tasks_list .priority.tag').live('click',function(){
		OC.ATasks.filter(this, '.priority.tag');
	});

	$('#tasks_list .location.tag').live('click',function(){
		OC.ATasks.filter(this, '.location.tag');
	});

	$('#tasks_order_category').click(function(){
		var tasks = $('#tasks_list .task').not('.clone');
		var collection = {};
		tasks.each(function(i, task) {
			var categories = $(task).data('task').categories;
			$(categories).each(function() {
				if (!collection.hasOwnProperty(this)) {
					collection[this] = [];
				}
				collection[this].push(task);
				if (categories.length > 1) {
					task = $(task).clone(true).addClass('clone').get(0);
				}
			});
			if (categories.length == 0) {
				if (!collection.hasOwnProperty('')) {
					collection[''] = [];
				}
				collection[''].push(task);
			}
		});
		var labels = [];
		for (var label in collection) {
			labels.push(label);
		}
		labels.sort();
		tasks.detach();
		var $tasks = $('#tasks_list').empty();
		for (var index in labels) {
			var label = labels[index];
			var container = $('<div>').appendTo($tasks);
			if (label == '') {
				label = t('tasks', 'No category');
			}
			$('<h1>').text(label).appendTo(container);
			container.append(collection[labels[index]]);
		}
	});

	$('#tasks_order_due').click(function(){
		OC.ATasks.order(function(a, b){
			a = $(a).data('task').due;
			b = $(b).data('task').due;
			return OC.ATasks.bool_string_cmp(a, b);
		});
	});

	$('#tasks_order_complete').click(function(){
		OC.ATasks.order(function(a, b){
			return ($(a).data('task').complete - $(b).data('task').complete) ||
				OC.ATasks.bool_string_cmp($(a).data('task').completed, $(b).data('task').completed);
		});
	});

	$('#tasks_order_location').click(function(){
		OC.ATasks.order(function(a, b){
			a = $(a).data('task').location;
			b = $(b).data('task').location;
			return OC.ATasks.bool_string_cmp(a, b);
		});
	});

	$('#tasks_order_prio').click(function(){
		OC.ATasks.order(function(a, b){
			return $(a).data('task').priority
			     - $(b).data('task').priority;
		});
	});

	$('#tasks_order_label').click(function(){
		OC.ATasks.order(function(a, b){
			return $(a).data('task').summary.localeCompare(
			       $(b).data('task').summary);
		});
	});

	$('#tasks_addtask').click(function(){
		var input = $('#tasks_newtask').val();
		var calendar_id = $("#tasks_lists").data('active_id');
		$.post(OC.filePath('atasks', 'ajax', 'addtask.php'),{text:input,calendar:calendar_id},function(jsondata){
			if(jsondata.status == 'success'){
				$('#tasks_list').append(OC.ATasks.create_task_div(jsondata.task));
				$('#tasks_newtask').val('');
			}
			else{
				alert(jsondata.data.message);
			}
		});
		return false;
	});

	$('#create_new_confirm').click(function() {
		var name = $("input[name='create_new_name']").val();

		if(name!='' && name!='new calendar') {
			$.post(OC.filePath('atasks', 'ajax', 'addcalendar.php'), {name:name}, function(jsondata) {
				if(jsondata.status == "success") {
					$("input[name='create_new_name']").val('new calendar');
					calendars = jsondata.calendars;
					$('#tasks_lists div:not(".all"):not(".done"):not(".create_new")').remove();
					$.each(calendars, function(i, calendar) {
						OC.ATasks.List.create_cal_div(calendar).insertBefore('#tasks_lists .done');
					});
				} else {
					alert(jsondata.message);
				}
			});
		}
	});

	$("input[name='create_new_name']").click(function() {
		if( $("input[name='create_new_name']").val() == 'new calendar')
			$("input[name='create_new_name']").val('');
	});
	$("input[name='create_new_name']").focusout(function() {
		if( $("input[name='create_new_name']").val() == '')
			$("input[name='create_new_name']").val('new calendar');
	});
	

	OCCategories.app = 'calendar';
});
