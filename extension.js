import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Pango from 'gi://Pango';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

const UUID = 'orbit-desktop-layer@local';
const PRIORITIES = ['MEDIUM', 'HIGH', 'LOW'];
const TIMER_MODES = {
    focus: { label: 'FOCUS', seconds: 25 * 60 },
    short: { label: 'SHORT BREAK', seconds: 5 * 60 },
    long: { label: 'LONG BREAK', seconds: 15 * 60 },
};

// English text below is an interpretive rendering, not a word-for-word gloss.
const KURALS = [
    {
        number: 1,
        tamil: 'அகர முதல எழுத்தெல்லாம் ஆதி\nபகவன் முதற்றே உலகு',
        meaning: 'As “A” is first among letters, the First Cause is first in the world.',
        note: 'The opening couplet begins with first principles: understanding grows from recognising what comes before everything else.',
    },
    {
        number: 71,
        tamil: 'அன்பிற்கும் உண்டோ அடைக்குந்தாழ்\nஆர்வலர் புன்கணீர் பூசல் தரும்',
        meaning: 'Can love be locked away? The tears of the loving reveal it.',
        note: 'True affection finds a way to show itself, even when a person tries to keep it hidden.',
    },
    {
        number: 100,
        tamil: 'இனிய உளவாக இன்னாத கூறல்\nகனியிருப்பக் காய்கவர்ந் தற்று',
        meaning: 'Harsh words when kind words are available are like choosing unripe fruit over ripe fruit.',
        note: 'Choose words that are truthful and considerate when you have the choice.',
    },
    {
        number: 131,
        tamil: 'ஒழுக்கம் விழுப்பம் தரலான் ஒழுக்கம்\nஉயிரினும் ஓம்பப் படும்',
        meaning: 'Good conduct brings distinction; therefore, guard it more carefully than life.',
        note: 'Integrity is not a finishing touch. It is a foundation for lasting respect.',
    },
    {
        number: 391,
        tamil: 'கற்க கசடறக் கற்பவை கற்றபின்\nநிற்க அதற்குத் தக',
        meaning: 'Learn thoroughly what is worth learning, then live in a way that reflects it.',
        note: 'Learning becomes wisdom when it changes how we act.',
    },
    {
        number: 467,
        tamil: 'எண்ணித் துணிக கருமம் துணிந்தபின்\nஎண்ணுவம் என்பது இழுக்கு',
        meaning: 'Think before you begin; to think only after committing is a mistake.',
        note: 'Plan the next step, check the risks, then act with purpose.',
    },
    {
        number: 619,
        tamil: 'தெய்வத்தான் ஆகா தெனினும் முயற்சிதன்\nமெய்வருத்தக் கூலி தரும்',
        meaning: 'Even when fortune does not grant success, sincere effort has its own reward.',
        note: 'You cannot control every outcome, but you can control the care you bring to your work.',
    },
];

const DAILY_QUOTES = [
    {
        signature: 'Make space for\nwhat matters.',
        clock: 'Small steps every day\nlead to big results.',
        wall: 'Discipline today builds\nthe freedom tomorrow.',
    },
    {
        signature: 'Progress over\nperfection.',
        clock: 'Show up, focus, and\nimprove one step at a time.',
        wall: 'Small steps each day make\nremarkable journeys.',
    },
    {
        signature: 'Build with\nintention.',
        clock: 'Do the next right thing;\nlet consistency do the rest.',
        wall: 'Your future is shaped by\nthe work you repeat.',
    },
    {
        signature: 'Stay curious.\nKeep building.',
        clock: 'Every challenge can\nstrengthen your craft.',
        wall: 'Learn deeply. Build carefully.\nLet the work speak.',
    },
    {
        signature: 'One thing at\na time.',
        clock: 'Protect your attention;\nfinish what matters most.',
        wall: 'Focus turns effort into\nmeaningful progress.',
    },
    {
        signature: 'Be patient\nwith progress.',
        clock: 'Good work grows through\npractice, not hurry.',
        wall: 'Mastery is built one\nthoughtful day at a time.',
    },
    {
        signature: 'Create your\nown momentum.',
        clock: 'Start small. Stay steady.\nMake today count.',
        wall: 'Consistency carries you\nfurther than intensity.',
    },
    {
        signature: 'Think clearly.\nBuild boldly.',
        clock: 'A thoughtful plan makes\nthe next step simpler.',
        wall: 'Ideas become real when\nyou give them time.',
    },
    {
        signature: 'Choose the\nlong game.',
        clock: 'Practice the fundamentals;\nlet skill compound.',
        wall: 'What you improve daily\nbecomes your advantage.',
    },
    {
        signature: 'Make room\nto learn.',
        clock: 'Stay humble enough to learn\nand brave enough to try.',
        wall: 'Every new concept begins\nwith a question.',
    },
    {
        signature: 'Quiet focus.\nMeaningful work.',
        clock: 'Reduce the noise, choose a goal,\nand give it your best.',
        wall: 'A clear mind gives good work\nspace to grow.',
    },
    {
        signature: 'Design your\ndirection.',
        clock: 'Small deliberate choices\nshape the life you build.',
        wall: 'Move with purpose,\nnot just speed.',
    },
    {
        signature: 'Keep your\nstandards high.',
        clock: 'Care about the details;\nthey become the quality.',
        wall: 'Excellence is the sum of\nsmall things done well.',
    },
    {
        signature: 'Begin again,\nwith intent.',
        clock: 'A fresh day is a chance\nto make progress.',
        wall: 'Renew your focus and keep\nbuilding what matters.',
    },
];


const SUPPORTED_PHOTO = /\.(jpe?g|png|webp)$/i;

export default class OrbitDesktopLayer extends Extension {
    enable() {
        this._sources = new Set();
        this._stageSignals = [];
        this._displaySignal = 0;
        this._studySessions = [];
        this._calendarYear = new Date().getFullYear();
        this._calendarMonth = new Date().getMonth();
        this._sessionFile = Gio.File.new_for_path(
            GLib.build_filenamev([GLib.get_user_data_dir(), 'orbit-desktop-layer', 'study-sessions.json']),
        );
        this._taskFile = Gio.File.new_for_path(
            GLib.build_filenamev([GLib.get_user_data_dir(), 'orbit-desktop-layer', 'tasks.json']),
        );
        this._loadTasks();
        this._loadStudySessions();

        this._selectedPriority = 'MEDIUM';
        this._timerMode = 'focus';
        this._remainingSeconds = TIMER_MODES.focus.seconds;
        this._timerRunning = false;
        this._timerDeadline = 0;
        this._timerStartedAtMs = 0;
        this._timerPlannedSeconds = TIMER_MODES.focus.seconds;
        const today = GLib.DateTime.new_now_local();
        this._kuralIndex = this._getLocalDayIndex(today, KURALS.length);
        this._kuralDayKey = today.format('%Y-%m-%d');
        this._quoteDayKey = this._kuralDayKey;
        this._dailyQuoteIndex = this._getLocalDayIndex(today, DAILY_QUOTES.length);
        this._photoIndex = 0;
        this._photos = [];

        this._stylesheet = this.dir.get_child('stylesheet.css');
        this._theme = St.ThemeContext.get_for_stage(global.stage).get_theme();
        try {
            if (this._stylesheet.query_exists(null))
                this._theme.load_stylesheet(this._stylesheet);
        } catch (e) {
            logError(e, 'ORBIT could not load its stylesheet');
        }

        this._build();
        this._renderDailyQuotes();
        this._resizeToStage();
        this._updateClockAndTimer();
        this._renderTasks();
        this._renderKural();
        this._renderStudyTracker();
        this._nextPhoto(false);

        this._addSource(GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            this._updateClockAndTimer();
            return GLib.SOURCE_CONTINUE;
        }));
        this._addSource(GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 22, () => {
            this._nextPhoto(true);
            return GLib.SOURCE_CONTINUE;
        }));

        // Respond to resolution, monitor arrangement, and scaling changes.
        this._stageSignals.push(global.stage.connect('notify::width', () => this._resizeToStage()));
        this._stageSignals.push(global.stage.connect('notify::height', () => this._resizeToStage()));
        // GNOME may reorder window actors as windows are opened or raised. Reassert
        // top of the desktop background group after restacking, still beneath app windows.
        this._displaySignal = global.display.connect_after('restacked', () => this._keepLayerBelowWindows());


    }

    disable() {
        if (this._timerStartedAtMs)
            this._recordTimerSession(false, 'desktop reload');
        for (const id of this._sources)
            GLib.source_remove(id);
        this._sources.clear();


        for (const id of this._stageSignals) {
            try { global.stage.disconnect(id); } catch (_) { }
        }
        this._stageSignals = [];
        if (this._displaySignal) {
            try { global.display.disconnect(this._displaySignal); } catch (_) { }
            this._displaySignal = 0;
        }


        if (this._root) {
            this._root.destroy();
            this._root = null;
        }

        if (this._stylesheet && this._theme) {
            try { this._theme.unload_stylesheet(this._stylesheet); } catch (_) { }
        }
        this._stylesheet = null;
        this._theme = null;

        this._taskEntry = null;
        this._taskDueEntry = null;
        this._calendarPanel = null;
        this._calendarGrid = null;
        this._taskList = null;
        this._taskComposer = null;
        this._taskTabs = {};
        this._photo = null;
        this._photoThumbRow = null;
        this._photoThumbs = [];
        this._kuralCard = null;
    }

    _addSource(id) {
        if (id)
            this._sources.add(id);
        return id;
    }

    _label(text, extraClass = '') {
        const label = new St.Label({
            text,
            style_class: `orbit-label ${extraClass}`.trim(),
            y_align: Clutter.ActorAlign.CENTER,
        });
        // ORBIT prioritizes readable, complete text: never silently replace the
        // end of a heading or sentence with an ellipsis. WORD_CHAR also handles
        // long terms that otherwise cannot break at a normal space.
        try {
            label.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
            label.clutter_text.line_wrap = true;
            label.clutter_text.line_wrap_mode = Pango.WrapMode.WORD_CHAR;
            label.clutter_text.single_line_mode = false;
        } catch (_) { /* Keep the label usable if a Shell minor release differs. */ }
        return label;
    }

    _box(vertical = false, styleClass = '', extra = {}) {
        return new St.BoxLayout({
            orientation: vertical ? Clutter.Orientation.VERTICAL : Clutter.Orientation.HORIZONTAL,
            style_class: styleClass,
            ...extra,
        });
    }

    _button(text, onClick, extraClass = '') {
        const button = new St.Button({
            label: text,
            style_class: `orbit-button ${extraClass}`.trim(),
            reactive: true,
            can_focus: true,
            track_hover: true,
        });
        button.connect('clicked', onClick);
        try {
            const child = button.get_child();
            const textActor = child?.clutter_text ? child.clutter_text : child;
            if (textActor && 'ellipsize' in textActor) {
                textActor.ellipsize = Pango.EllipsizeMode.NONE;
                textActor.line_wrap = true;
                textActor.line_wrap_mode = Pango.WrapMode.WORD_CHAR;
                textActor.single_line_mode = false;
            }
        } catch (_) { /* Button remains functional if the child implementation differs. */ }
        return button;
    }

    _card(title, subtitle = '') {
        const card = this._box(true, 'orbit-card', { x_expand: true });
        const header = this._box(false, 'orbit-card-head', { x_expand: true });
        const titleLabel = this._label(title, 'orbit-card-title');
        titleLabel.x_expand = true;
        header.add_child(titleLabel);
        if (subtitle)
            header.add_child(this._label(subtitle, 'orbit-card-subtitle'));
        card.add_child(header);
        return card;
    }

    _build() {
        // Place ORBIT in GNOME Shell's desktop background group, above the
        // wallpaper but below ordinary application windows. This is a native
        // Shell actor, not a floating window.
        this._root = new St.Widget({
            name: UUID,
            style_class: 'orbit-root',
            reactive: false,
            can_focus: false,
            layout_manager: new Clutter.BinLayout(),
        });
        this._root.set_position(0, 0);
        this._root.set_size(global.stage.width, global.stage.height);
        const desktopGroup = Main.layoutManager._backgroundGroup;
        if (!desktopGroup)
            throw new Error('ORBIT could not find GNOME Shell desktop background group');
        desktopGroup.add_child(this._root);

        this._layout = this._box(false, 'orbit-layout', { x_expand: true, y_expand: true });
        this._root.add_child(this._layout);

        this._left = this._box(true, 'orbit-column orbit-left', { x_expand: true, y_expand: true });
        this._center = this._box(true, 'orbit-column orbit-center', { x_expand: true, y_expand: true });
        this._right = this._box(true, 'orbit-column orbit-right', { x_expand: true, y_expand: true });
        this._layout.add_child(this._left);
        this._layout.add_child(this._center);
        this._layout.add_child(this._right);

        this._buildClockAndTasks();
        this._buildFocusProductivity();
        this._buildCenterColumn();
    }

    _keepLayerBelowWindows() {
        const desktopGroup = Main.layoutManager._backgroundGroup;
        if (!this._root || !desktopGroup)
            return;

        if (this._root.get_parent() !== desktopGroup) {
            const parent = this._root.get_parent();
            if (parent)
                parent.remove_child(this._root);
            desktopGroup.add_child(this._root);
        }

        const lastIndex = desktopGroup.get_n_children() - 1;
        if (lastIndex >= 0 && desktopGroup.get_child_at_index(lastIndex) !== this._root)
            desktopGroup.set_child_at_index(this._root, lastIndex);
    }

    _resizeToStage() {
        if (!this._root || !this._layout)
            return;
        const width = Math.max(960, global.stage.width);
        const height = Math.max(600, global.stage.height);
        this._root.set_position(0, 0);
        this._root.set_size(width, height);
        this._layout.set_size(width, height);

        // Version 10 composition: clock and tasks on the left, large Pomodoro
        // and study tracker in the centre, memories and Thirukkural on the right.
        const usable = Math.max(860, width - 126);
        const leftWidth = Math.round(usable * 0.30);
        const centerWidth = Math.round(usable * 0.40);
        const rightWidth = usable - leftWidth - centerWidth;
        this._left.set_width(leftWidth);
        this._center.set_width(centerWidth);
        this._right.set_width(rightWidth);

        if (this._kuralCard) {
            // Keep the reading card aligned with the full width of the news card.
            this._kuralCard.x_expand = true;
            this._kuralCard.set_width(rightWidth);
            this._kuralCard.x_align = Clutter.ActorAlign.FILL;
        }
    }

    _buildClockAndTasks() {
        // Clock / greeting card with the round neon dial from the reference.
        const clock = this._box(true, 'orbit-card orbit-clock-card', { x_expand: true, y_expand: false });
        // Cap the hero card to its intended dashboard height. The old expanding
        // row could make the whole card absorb the column's spare height and
        // leave the greeting at the top while the clock dial drifted downward.
        clock.set_height(258);
        const timeRow = this._box(false, 'orbit-clock-row', { x_expand: true, y_expand: true });
        timeRow.y_align = Clutter.ActorAlign.CENTER;
        const clockStack = this._box(true, 'orbit-clock-stack', { x_expand: false, y_expand: false });
        clockStack.set_size(168, 168);
        clockStack.x_align = Clutter.ActorAlign.CENTER;
        clockStack.y_align = Clutter.ActorAlign.CENTER;
        // Use equal expanding spacers so all three labels sit on the dial's
        // vertical centerline instead of clustering at its top edge.
        clockStack.add_child(new St.Widget({
            style_class: 'orbit-dial-spacer', x_expand: true, y_expand: true, reactive: false,
        }));
        this._periodLabel = this._label('--', 'orbit-period');
        this._clockLabel = this._label('--:--', 'orbit-clock');
        this._dateLabel = this._label('', 'orbit-date');
        for (const dialLabel of [this._periodLabel, this._clockLabel, this._dateLabel]) {
            dialLabel.x_expand = true;
            dialLabel.x_align = Clutter.ActorAlign.CENTER;
            dialLabel.clutter_text.x_align = Clutter.ActorAlign.CENTER;
            dialLabel.clutter_text.line_wrap = false;
            dialLabel.clutter_text.single_line_mode = true;
            dialLabel.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
        }
        this._periodLabel.set_width(58);
        this._clockLabel.set_width(150);
        this._dateLabel.set_width(148);
        clockStack.add_child(this._periodLabel);
        clockStack.add_child(this._clockLabel);
        clockStack.add_child(this._dateLabel);
        clockStack.add_child(new St.Widget({
            style_class: 'orbit-dial-spacer', x_expand: true, y_expand: true, reactive: false,
        }));
        timeRow.add_child(clockStack);

        const greetingStack = this._box(true, 'orbit-greeting-stack', { x_expand: true, y_expand: false });
        greetingStack.y_align = Clutter.ActorAlign.CENTER;
        this._greetingLabel = this._label('GOOD EVENING', 'orbit-greeting');
        greetingStack.add_child(this._greetingLabel);
        this._greetingSignature = this._label('', 'orbit-greeting-signature');
        this._clockDailyQuote = this._label('', 'orbit-quote');
        this._clockDailyQuote.clutter_text.line_wrap = true;
        this._clockDailyQuote.clutter_text.line_wrap_mode = Pango.WrapMode.WORD_CHAR;
        greetingStack.add_child(this._greetingSignature);
        greetingStack.add_child(this._clockDailyQuote);
        greetingStack.add_child(this._label('FOCUS  •  BUILD  •  REPEAT', 'orbit-clock-tag'));
        timeRow.add_child(greetingStack);
        clock.add_child(timeRow);
        this._left.add_child(clock);

        // To-do surface: a compact list first; the composer opens on demand.
        const todo = this._box(true, 'orbit-card orbit-todo-card', { x_expand: true });
        const todoHeader = this._box(false, 'orbit-card-head orbit-todo-head', { x_expand: true });
        const todoTitle = this._label('To-Do List', 'orbit-card-title');
        todoTitle.x_expand = true;
        todoHeader.add_child(todoTitle);
        this._taskAddToggle = this._button('+ ADD TASK', () => this._toggleTaskComposer(), 'orbit-header-action');
        todoHeader.add_child(this._taskAddToggle);
        todo.add_child(todoHeader);

        this._taskComposer = this._box(true, 'orbit-task-composer', { x_expand: true });
        this._taskComposer.visible = false;
        const entryRow = this._box(false, 'orbit-input-row', { x_expand: true });
        this._taskEntry = new St.Entry({
            hint_text: 'Add a task…',
            style_class: 'orbit-entry',
            can_focus: true,
            x_expand: true,
        });
        this._taskEntry.clutter_text.connect('activate', () => this._addTask());
        this._priorityButton = this._button('MEDIUM ▾', () => this._cyclePriority(), 'orbit-priority-button orbit-priority-medium');
        entryRow.add_child(this._taskEntry);
        entryRow.add_child(this._priorityButton);
        entryRow.add_child(this._button('ADD', () => this._addTask(), 'orbit-add-button'));
        this._taskComposer.add_child(entryRow);

        const dueRow = this._box(false, 'orbit-input-row', { x_expand: true });
        this._taskDueEntry = new St.Entry({
            hint_text: 'Optional deadline: choose a date',
            style_class: 'orbit-entry orbit-date-entry',
            can_focus: true,
            x_expand: true,
        });
        this._taskDueEntry.clutter_text.connect('activate', () => this._addTask());
        this._calendarToggle = this._button('▦ PICK DATE', () => this._toggleCalendarPicker(), 'orbit-date-picker-toggle');
        this._clearDeadlineButton = this._button('CLEAR', () => {
            this._taskDueEntry.set_text('');
            this._calendarToggle.set_label('▦ PICK DATE');
            if (this._calendarPanel) this._calendarPanel.visible = false;
        }, 'orbit-quiet-button orbit-date-clear');
        dueRow.add_child(this._taskDueEntry);
        dueRow.add_child(this._calendarToggle);
        dueRow.add_child(this._clearDeadlineButton);
        this._taskComposer.add_child(dueRow);

        this._calendarPanel = this._box(true, 'orbit-calendar-picker', { x_expand: true });
        this._calendarPanel.visible = false;
        const calendarHead = this._box(false, 'orbit-calendar-head', { x_expand: true });
        calendarHead.add_child(this._button('‹', () => this._shiftCalendarMonth(-1), 'orbit-round-button orbit-calendar-nav'));
        this._calendarMonthLabel = this._label('', 'orbit-calendar-month');
        this._calendarMonthLabel.x_expand = true;
        this._calendarMonthLabel.clutter_text.x_align = Clutter.ActorAlign.CENTER;
        calendarHead.add_child(this._calendarMonthLabel);
        calendarHead.add_child(this._button('›', () => this._shiftCalendarMonth(1), 'orbit-round-button orbit-calendar-nav'));
        this._calendarPanel.add_child(calendarHead);

        const weekdays = this._box(false, 'orbit-calendar-weekdays', { x_expand: true });
        for (const dayName of ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']) {
            const dayLabel = this._label(dayName, 'orbit-calendar-weekday');
            dayLabel.x_expand = true;
            dayLabel.clutter_text.x_align = Clutter.ActorAlign.CENTER;
            weekdays.add_child(dayLabel);
        }
        this._calendarPanel.add_child(weekdays);
        this._calendarGrid = this._box(true, 'orbit-calendar-grid', { x_expand: true });
        this._calendarPanel.add_child(this._calendarGrid);
        this._taskComposer.add_child(this._calendarPanel);
        this._renderCalendar();
        this._taskError = this._label('', 'orbit-error');
        this._taskComposer.add_child(this._taskError);
        todo.add_child(this._taskComposer);

        this._taskFilter = 'today';
        this._taskTabs = {};
        const tabs = this._box(false, 'orbit-task-tabs', { x_expand: true });
        for (const [filter, label] of [['today', 'Today'], ['upcoming', 'Upcoming'], ['completed', 'Completed']]) {
            const button = this._button(label, () => this._setTaskFilter(filter), `orbit-task-tab ${filter === this._taskFilter ? 'selected' : ''}`);
            button.x_expand = true;
            this._taskTabs[filter] = button;
            tabs.add_child(button);
        }
        todo.add_child(tabs);

        this._taskList = this._box(true, 'orbit-task-list', { x_expand: true });
        this._taskScroll = new St.ScrollView({
            style_class: 'orbit-task-scroll',
            overlay_scrollbars: true,
            enable_mouse_scrolling: true,
            x_expand: true,
            // Do not eat the entire remaining column height when there are
            // only zero or one tasks; keep the scrollable list at a useful size.
        });
        this._taskScroll.set_policy(St.PolicyType.NEVER, St.PolicyType.AUTOMATIC);
        this._taskScroll.set_child(this._taskList);
        this._taskScroll.set_height(174);
        todo.add_child(this._taskScroll);

        this._progressTrack = new St.Widget({
            style_class: 'orbit-progress-track',
            x_expand: true,
            layout_manager: new Clutter.BinLayout(),
        });
        this._progressFill = new St.Widget({ style_class: 'orbit-progress-fill' });
        this._progressFill.set_height(5);
        this._progressTrack.add_child(this._progressFill);
        this._progressTrack.connect('notify::width', () => this._updateProgressBar());
        todo.add_child(this._progressTrack);

        const taskFooter = this._box(false, 'orbit-task-footer', { x_expand: true });
        this._taskCount = this._label('0 OPEN', 'orbit-task-count');
        this._taskProgressLabel = this._label('0% COMPLETE', 'orbit-muted orbit-small');
        this._taskCount.x_expand = true;
        taskFooter.add_child(this._taskCount);
        taskFooter.add_child(this._taskProgressLabel);
        taskFooter.add_child(this._button('CLEAR DONE', () => this._clearCompletedTasks(), 'orbit-quiet-button'));
        todo.add_child(taskFooter);
        this._left.add_child(todo);

    }



    _buildFocusProductivity() {
        const focus = this._card('Focus / Pomodoro', 'LOCAL STUDY TRACKER');
        focus.add_style_class_name('orbit-focus-card orbit-focus-hero');
        const modeRow = this._box(false, 'orbit-mode-row', { x_expand: true });
        this._modeButtons = {};
        for (const [mode, details] of Object.entries(TIMER_MODES)) {
            const label = mode === 'focus' ? 'FOCUS 25' : mode === 'short' ? 'SHORT BREAK 5' : 'LONG BREAK 15';
            const button = this._button(label, () => this._selectTimerMode(mode), `orbit-mode-button ${mode === this._timerMode ? 'selected' : ''}`);
            button.x_expand = true;
            this._modeButtons[mode] = button;
            modeRow.add_child(button);
        }
        focus.add_child(modeRow);

        const body = this._box(false, 'orbit-focus-hero-body', { x_expand: true });
        const timerColumn = this._box(true, 'orbit-timer-column orbit-timer-column-large', { x_expand: false });
        // Keep the dial's shape independent from the text layout. A centered
        // BinLayout overlay prevents the timer caption from inheriting a tiny
        // natural-width allocation (the old layout clipped FOCUS to 'FOCU-').
        this._timerDial = new St.Widget({
            style_class: 'orbit-timer-dial orbit-timer-dial-large',
            x_expand: false,
            y_expand: false,
            reactive: false,
            can_focus: false,
            layout_manager: new Clutter.BinLayout(),
        });
        this._timerDial.set_size(224, 224);
        this._timerDial.x_align = Clutter.ActorAlign.CENTER;
        this._timerDial.y_align = Clutter.ActorAlign.CENTER;

        this._timerContent = this._box(true, 'orbit-timer-content', {
            x_expand: false,
            y_expand: false,
        });
        this._timerContent.x_align = Clutter.ActorAlign.CENTER;
        this._timerContent.y_align = Clutter.ActorAlign.CENTER;

        this._timerLabel = this._label('25:00', 'orbit-timer orbit-timer-large');
        this._timerCaption = this._label('FOCUS', 'orbit-timer-caption');
        for (const textActor of [this._timerLabel, this._timerCaption]) {
            textActor.set_width(160);
            textActor.x_expand = false;
            textActor.y_expand = false;
            textActor.x_align = Clutter.ActorAlign.CENTER;
            const text = textActor.clutter_text;
            text.x_align = Clutter.ActorAlign.CENTER;
            text.ellipsize = Pango.EllipsizeMode.NONE;
            text.line_wrap = false;
            text.single_line_mode = true;
        }
        this._timerContent.add_child(this._timerLabel);
        this._timerContent.add_child(this._timerCaption);
        this._timerDial.add_child(this._timerContent);
        timerColumn.add_child(this._timerDial);
        this._timerStatus = this._label('READY WHEN YOU ARE', 'orbit-timer-status orbit-timer-status-large');
        this._timerStatus.clutter_text.x_align = Clutter.ActorAlign.CENTER;
        timerColumn.add_child(this._timerStatus);
        const actions = this._box(false, 'orbit-row orbit-timer-actions', { x_expand: true });
        this._timerToggleButton = this._button('▶ START FOCUS', () => this._toggleTimer(), 'orbit-primary orbit-start-button');
        this._timerToggleButton.x_expand = true;
        actions.add_child(this._timerToggleButton);
        actions.add_child(this._button('RESET', () => this._resetTimer(), 'orbit-quiet-button orbit-reset-button'));
        timerColumn.add_child(actions);
        body.add_child(timerColumn);

        const stats = this._box(true, 'orbit-focus-stats orbit-focus-stats-large', { x_expand: true, y_expand: true });
        stats.add_child(this._label('TODAY AT A GLANCE', 'orbit-focus-stat-title orbit-subsection-title'));
        const totals = this._box(false, 'orbit-study-totals', { x_expand: true });
        const focusTotal = this._box(true, 'orbit-study-total-tile', { x_expand: true });
        focusTotal.add_child(this._label('FOCUSED', 'orbit-total-caption'));
        this._focusTodayValue = this._label('0m', 'orbit-total-value');
        focusTotal.add_child(this._focusTodayValue);
        const breakTotal = this._box(true, 'orbit-study-total-tile', { x_expand: true });
        breakTotal.add_child(this._label('BREAKS', 'orbit-total-caption'));
        this._breakTodayValue = this._label('0m', 'orbit-total-value');
        breakTotal.add_child(this._breakTodayValue);
        const sessionsTotal = this._box(true, 'orbit-study-total-tile', { x_expand: true });
        sessionsTotal.add_child(this._label('FOCUS SESSIONS', 'orbit-total-caption'));
        this._focusSessionsValue = this._label('0', 'orbit-total-value');
        sessionsTotal.add_child(this._focusSessionsValue);
        totals.add_child(focusTotal);
        totals.add_child(breakTotal);
        totals.add_child(sessionsTotal);
        stats.add_child(totals);
        stats.add_child(this._label('PRODUCTIVE STUDY HOURS', 'orbit-focus-stat-title orbit-subsection-title'));
        this._productiveHoursList = this._box(true, 'orbit-productive-hours', { x_expand: true });
        const hoursScroll = new St.ScrollView({ style_class: 'orbit-hours-scroll', overlay_scrollbars: true, enable_mouse_scrolling: true, x_expand: true });
        hoursScroll.set_policy(St.PolicyType.NEVER, St.PolicyType.AUTOMATIC);
        hoursScroll.set_height(175);
        hoursScroll.set_child(this._productiveHoursList);
        stats.add_child(hoursScroll);
        body.add_child(stats);
        focus.add_child(body);
        this._center.add_child(focus);

        const history = this._card('Session History', 'FOCUS + BREAK DURATIONS · STORED LOCALLY');
        history.add_style_class_name('orbit-history-card');
        const historySummary = this._label('Every finished or interrupted timer is recorded with its duration and time.', 'orbit-history-intro');
        historySummary.clutter_text.line_wrap = true;
        history.add_child(historySummary);
        this._studyLogList = this._box(true, 'orbit-study-log', { x_expand: true });
        const logScroll = new St.ScrollView({ style_class: 'orbit-log-scroll', overlay_scrollbars: true, enable_mouse_scrolling: true, x_expand: true });
        logScroll.set_policy(St.PolicyType.NEVER, St.PolicyType.AUTOMATIC);
        logScroll.set_height(190);
        logScroll.set_child(this._studyLogList);
        history.add_child(logScroll);
        this._center.add_child(history);
    }

    _buildCenterColumn() {
        // The cinematic wallpaper carries the open center; the memories card
        // floats above it, leaving a deliberate breathing space below.
        const memories = this._card('Memories', 'PHOTO ARCHIVE');
        memories.add_style_class_name('orbit-memory-card');
        this._photo = new St.Widget({
            style_class: 'orbit-photo',
            x_expand: true,
            reactive: false,
            layout_manager: new Clutter.BinLayout(),
        });
        this._photo.set_height(150);
        this._photoPlaceholder = this._label('YOUR MOMENTS\nLIVE HERE\n\nAdd photos to Pictures / ORBIT-Memories', 'orbit-photo-placeholder');
        this._photoPlaceholder.x_expand = true;
        this._photoPlaceholder.y_expand = true;
        this._photoPlaceholder.x_align = Clutter.ActorAlign.CENTER;
        this._photo.add_child(this._photoPlaceholder);
        memories.add_child(this._photo);

        this._photoThumbRow = this._box(false, 'orbit-photo-thumbnails', { x_expand: true });
        this._photoThumbs = [];
        for (let i = 0; i < 4; i++) {
            const thumb = new St.Button({
                style_class: 'orbit-photo-thumb',
                reactive: true,
                can_focus: true,
                track_hover: true,
            });
            thumb.set_size(82, 62);
            thumb.connect('clicked', () => this._showPhotoAtIndex(this._photoThumbStart + i));
            this._photoThumbs.push(thumb);
            this._photoThumbRow.add_child(thumb);
        }
        memories.add_child(this._photoThumbRow);

        const photoFooter = this._box(false, 'orbit-row orbit-photo-footer', { x_expand: true });
        this._photoCaption = this._label('WAITING FOR PHOTOS', 'orbit-photo-caption orbit-muted orbit-small');
        this._photoCaption.x_expand = true;
        photoFooter.add_child(this._photoCaption);
        photoFooter.add_child(this._button('OPEN FOLDER', () => this._openMemoriesFolder(), 'orbit-quiet-button'));
        photoFooter.add_child(this._button('‹', () => this._previousPhoto(), 'orbit-round-button'));
        photoFooter.add_child(this._button('›', () => this._nextPhoto(true), 'orbit-round-button'));
        memories.add_child(photoFooter);
        this._right.add_child(memories);

        const spacer = new St.Widget({
            style_class: 'orbit-center-spacer',
            x_expand: true,
            y_expand: false,
            reactive: false,
        });
        this._right.add_child(spacer);
        const quote = this._box(true, 'orbit-wall-quote', { x_expand: true });
        this._wallQuoteText = this._label('', 'orbit-wall-quote-text');
        this._wallQuoteText.x_expand = true;
        this._wallQuoteText.clutter_text.x_align = Clutter.ActorAlign.CENTER;
        this._wallQuoteText.clutter_text.line_wrap = true;
        this._wallQuoteText.clutter_text.line_wrap_mode = Pango.WrapMode.WORD_CHAR;
        quote.add_child(this._wallQuoteText);
        quote.add_child(this._label('━━━━━━', 'orbit-wall-quote-underline'));
        this._right.add_child(quote);

        const kural = this._card('Daily Thirukkural', 'TAMIL · ENGLISH');
        kural.add_style_class_name('orbit-kural-card');
        this._kuralCard = kural;
        const kuralHeader = this._box(false, 'orbit-kural-number-row');
        this._kuralNumber = this._label('', 'orbit-kural-number');
        this._kuralNumber.x_expand = true;
        kuralHeader.add_child(this._kuralNumber);
        kuralHeader.add_child(this._button('‹', () => this._changeKural(-1), 'orbit-round-button'));
        kuralHeader.add_child(this._button('›', () => this._changeKural(1), 'orbit-round-button'));
        kural.add_child(kuralHeader);
        this._kuralTamil = this._label('', 'orbit-tamil');
        this._kuralTamil.clutter_text.line_wrap = true;
        kural.add_child(this._kuralTamil);
        kural.add_child(this._label('ENGLISH MEANING', 'orbit-section-label'));
        this._kuralMeaning = this._label('', 'orbit-kural-meaning');
        this._kuralMeaning.clutter_text.line_wrap = true;
        kural.add_child(this._kuralMeaning);
        kural.add_child(this._label('EXPLANATION', 'orbit-section-label'));
        this._kuralNote = this._label('', 'orbit-kural-note');
        this._kuralNote.clutter_text.line_wrap = true;
        kural.add_child(this._kuralNote);
        this._right.add_child(kural);
    }


    _toggleCalendarPicker() {
        if (!this._calendarPanel)
            return;
        this._calendarPanel.visible = !this._calendarPanel.visible;
        if (this._calendarPanel.visible) {
            const current = this._taskDueEntry?.get_text().trim() || '';
            const match = current.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            if (match && this._isValidDate(current)) {
                this._calendarYear = Number(match[1]);
                this._calendarMonth = Number(match[2]) - 1;
            } else {
                const now = new Date();
                this._calendarYear = now.getFullYear();
                this._calendarMonth = now.getMonth();
            }
            this._renderCalendar();
        }
    }

    _shiftCalendarMonth(delta) {
        const date = new Date(this._calendarYear, this._calendarMonth + delta, 1);
        this._calendarYear = date.getFullYear();
        this._calendarMonth = date.getMonth();
        this._renderCalendar();
    }

    _chooseCalendarDate(day) {
        const y = this._calendarYear;
        const m = this._calendarMonth;
        const dateText = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (this._taskDueEntry)
            this._taskDueEntry.set_text(dateText);
        if (this._calendarToggle)
            this._calendarToggle.set_label(`${String(day).padStart(2, '0')} ${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][m]}`);
        if (this._calendarPanel)
            this._calendarPanel.visible = false;
        if (this._taskError)
            this._taskError.set_text('');
    }

    _renderCalendar() {
        if (!this._calendarGrid || !this._calendarMonthLabel)
            return;
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        this._calendarMonthLabel.set_text(`${months[this._calendarMonth]} ${this._calendarYear}`);
        this._calendarGrid.destroy_all_children();
        const first = new Date(this._calendarYear, this._calendarMonth, 1);
        const offset = (first.getDay() + 6) % 7; // Monday-first week.
        const daysInMonth = new Date(this._calendarYear, this._calendarMonth + 1, 0).getDate();
        const today = new Date();
        const todayText = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        const selectedText = this._taskDueEntry ? this._taskDueEntry.get_text().trim() : '';
        for (let week = 0; week < 6; week++) {
            const row = this._box(false, 'orbit-calendar-week', { x_expand: true });
            for (let col = 0; col < 7; col++) {
                const index = week * 7 + col;
                const day = index - offset + 1;
                if (day < 1 || day > daysInMonth) {
                    const blank = new St.Widget({ style_class: 'orbit-calendar-empty', x_expand: true, reactive: false });
                    blank.set_height(27);
                    row.add_child(blank);
                    continue;
                }
                const dateText = `${this._calendarYear}-${String(this._calendarMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                let klass = 'orbit-calendar-day';
                if (dateText === todayText) klass += ' today';
                if (dateText === selectedText) klass += ' selected';
                const button = this._button(String(day), () => this._chooseCalendarDate(day), klass);
                button.x_expand = true;
                button.set_height(27);
                row.add_child(button);
            }
            this._calendarGrid.add_child(row);
        }
    }

    _toggleTaskComposer() {
        if (!this._taskComposer)
            return;
        this._taskComposer.visible = !this._taskComposer.visible;
        if (this._taskAddToggle)
            this._taskAddToggle.set_label(this._taskComposer.visible ? 'CLOSE' : '+ ADD TASK');
        if (this._taskComposer.visible && this._taskEntry)
            this._taskEntry.grab_key_focus();
    }

    _setTaskFilter(filter) {
        if (!['today', 'upcoming', 'completed'].includes(filter))
            return;
        this._taskFilter = filter;
        for (const [key, button] of Object.entries(this._taskTabs || {}))
            button.set_style_class_name(`orbit-button orbit-task-tab ${key === filter ? 'selected' : ''}`);
        this._renderTasks();
    }

    _showPhotoAtIndex(index) {
        this._photos = this._findPhotos();
        if (!this._photos.length) {
            this._nextPhoto(false);
            return;
        }
        this._photoIndex = ((index % this._photos.length) + this._photos.length) % this._photos.length;
        this._nextPhoto(true);
    }

    _updatePhotoThumbnails() {
        if (!this._photoThumbRow || !this._photoThumbs)
            return;
        const photos = this._photos || [];
        if (!photos.length) {
            this._photoThumbRow.visible = false;
            return;
        }
        const currentIndex = Math.max(0, photos.indexOf(this._currentPhotoPath));
        this._photoThumbStart = currentIndex;
        this._photoThumbRow.visible = true;
        for (let i = 0; i < this._photoThumbs.length; i++) {
            const thumb = this._photoThumbs[i];
            if (i >= photos.length) {
                thumb.visible = false;
                continue;
            }
            thumb.visible = true;
            const path = photos[(currentIndex + i) % photos.length];
            const uri = Gio.File.new_for_path(path).get_uri();
            thumb.set_style_class_name(`orbit-photo-thumb ${i === 0 ? 'current' : ''}`);
            thumb.set_style(`background-image: url("${uri}"); background-size: cover; background-position: center;`);
        }
    }

    _getLocalDayIndex(now, length) {
        const year = Number(now.format('%Y'));
        const month = Number(now.format('%m')) - 1;
        const day = Number(now.format('%d'));
        const serialDay = Math.floor(Date.UTC(year, month, day) / 86400000);
        return ((serialDay % length) + length) % length;
    }

    _renderDailyQuotes() {
        const quote = DAILY_QUOTES[this._dailyQuoteIndex % DAILY_QUOTES.length];
        if (this._greetingSignature)
            this._greetingSignature.set_text(quote.signature);
        if (this._clockDailyQuote)
            this._clockDailyQuote.set_text(quote.clock);
        if (this._wallQuoteText)
            this._wallQuoteText.set_text(quote.wall);
    }

    _updateClockAndTimer() {
        if (!this._clockLabel)
            return GLib.SOURCE_REMOVE;
        const now = GLib.DateTime.new_now_local();
        const dayKey = now.format('%Y-%m-%d');
        if (dayKey !== this._kuralDayKey) {
            this._kuralDayKey = dayKey;
            this._kuralIndex = this._getLocalDayIndex(now, KURALS.length);
            this._dailyQuoteIndex = this._getLocalDayIndex(now, DAILY_QUOTES.length);
            this._renderKural();
            this._renderDailyQuotes();
            this._renderStudyTracker();
        }
        this._clockLabel.set_text(now.format('%I:%M'));
        this._periodLabel.set_text(now.format('%p'));
        this._dateLabel.set_text(now.format('%a, %d %b %Y'));
        const hour = Number(now.format('%H'));
        this._greetingLabel.set_text(hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening');

        if (this._timerRunning) {
            const remaining = Math.max(0, Math.ceil((this._timerDeadline - GLib.get_monotonic_time()) / 1000000));
            this._remainingSeconds = remaining;
            if (remaining <= 0) {
                this._timerRunning = false;
                this._timerDeadline = 0;
                this._remainingSeconds = 0;
                this._recordTimerSession(true, 'completed');
                this._timerStatus.set_text('SESSION COMPLETE · NICE WORK');
                this._timerToggleButton.set_label('▶ START AGAIN');
                try {
                    const finishedMode = this._timerMode === 'focus' ? 'Focus session complete. Take a break.' : 'Break finished. You can return to focus.';
                    Main.notify('ORBIT Focus', finishedMode);
                } catch (_) { }
            }
        }
        this._renderTimerLabel();
        return GLib.SOURCE_CONTINUE;
    }

    _renderTimerLabel() {
        if (!this._timerLabel)
            return;
        const m = Math.floor(this._remainingSeconds / 60).toString().padStart(2, '0');
        const sec = Math.max(0, this._remainingSeconds % 60).toString().padStart(2, '0');
        this._timerLabel.set_text(`${m}:${sec}`);
    }

    _selectTimerMode(mode) {
        if (!TIMER_MODES[mode])
            return;
        if (this._timerStartedAtMs)
            this._recordTimerSession(false, 'mode changed');
        else {
            this._timerRunning = false;
            this._timerDeadline = 0;
        }
        this._timerMode = mode;
        if (this._timerCaption)
            this._timerCaption.set_text(TIMER_MODES[mode].label);
        this._timerPlannedSeconds = TIMER_MODES[mode].seconds;
        this._remainingSeconds = TIMER_MODES[mode].seconds;
        this._timerDeadline = 0;
        for (const [key, button] of Object.entries(this._modeButtons))
            button.set_style_class_name(`orbit-button orbit-mode-button ${key === mode ? 'selected' : ''}`);
        this._timerStatus.set_text(`${TIMER_MODES[mode].label} READY`);
        this._timerToggleButton.set_label(mode === 'focus' ? '▶ START FOCUS' : '▶ START BREAK');
        this._renderTimerLabel();
    }

    _toggleTimer() {
        if (this._timerRunning) {
            this._remainingSeconds = Math.max(0, Math.ceil((this._timerDeadline - GLib.get_monotonic_time()) / 1000000));
            this._timerRunning = false;
            this._timerDeadline = 0;
            this._timerStatus.set_text('PAUSED · RESUME WHEN READY');
            this._timerToggleButton.set_label('▶ RESUME');
        } else {
            if (this._remainingSeconds <= 0)
                this._remainingSeconds = TIMER_MODES[this._timerMode].seconds;
            if (!this._timerStartedAtMs) {
                this._timerStartedAtMs = Date.now();
                this._timerPlannedSeconds = TIMER_MODES[this._timerMode].seconds;
            }
            this._timerRunning = true;
            this._timerDeadline = GLib.get_monotonic_time() + this._remainingSeconds * 1000000;
            this._timerStatus.set_text(`${TIMER_MODES[this._timerMode].label} IN PROGRESS`);
            this._timerToggleButton.set_label('Ⅱ PAUSE');
        }
        this._renderTimerLabel();
    }

    _resetTimer() {
        if (this._timerStartedAtMs)
            this._recordTimerSession(false, 'reset early');
        this._timerRunning = false;
        this._timerDeadline = 0;
        this._timerStartedAtMs = 0;
        this._timerPlannedSeconds = TIMER_MODES[this._timerMode].seconds;
        this._remainingSeconds = TIMER_MODES[this._timerMode].seconds;
        this._timerStatus.set_text(`${TIMER_MODES[this._timerMode].label} READY`);
        this._timerToggleButton.set_label(this._timerMode === 'focus' ? '▶ START FOCUS' : '▶ START BREAK');
        this._renderTimerLabel();
    }

    _recordTimerSession(completed, reason = '') {
        const nowUs = GLib.get_monotonic_time();
        if (this._timerRunning && this._timerDeadline)
            this._remainingSeconds = Math.max(0, Math.ceil((this._timerDeadline - nowUs) / 1000000));
        const plannedSeconds = Math.max(1, Number(this._timerPlannedSeconds) || TIMER_MODES[this._timerMode].seconds);
        const durationSeconds = completed
            ? plannedSeconds
            : Math.max(0, Math.min(plannedSeconds, plannedSeconds - Math.max(0, this._remainingSeconds)));
        if (this._timerStartedAtMs && durationSeconds > 0) {
            const endedAtMs = Date.now();
            this._studySessions.unshift({
                id: `${endedAtMs}-${Math.random().toString(36).slice(2, 8)}`,
                mode: this._timerMode,
                startedAtMs: this._timerStartedAtMs,
                endedAtMs,
                durationSeconds,
                plannedSeconds,
                completed: Boolean(completed),
                reason: reason || (completed ? 'completed' : 'interrupted'),
            });
            this._studySessions = this._studySessions.slice(0, 1500);
            this._saveStudySessions();
            this._renderStudyTracker();
        }
        this._timerRunning = false;
        this._timerDeadline = 0;
        this._timerStartedAtMs = 0;
        this._timerPlannedSeconds = TIMER_MODES[this._timerMode].seconds;
    }

    _loadStudySessions() {
        try {
            const [ok, contents] = this._sessionFile.load_contents(null);
            if (!ok) return;
            const parsed = JSON.parse(new TextDecoder().decode(contents));
            if (!Array.isArray(parsed)) return;
            this._studySessions = parsed.filter(session =>
                session && ['focus', 'short', 'long'].includes(session.mode) &&
                Number(session.startedAtMs) > 0 && Number(session.endedAtMs) > 0 &&
                Number(session.durationSeconds) > 0
            ).slice(0, 1500).map(session => ({
                id: String(session.id || `${session.endedAtMs}`),
                mode: session.mode,
                startedAtMs: Number(session.startedAtMs),
                endedAtMs: Number(session.endedAtMs),
                durationSeconds: Math.floor(Number(session.durationSeconds)),
                plannedSeconds: Math.floor(Number(session.plannedSeconds) || TIMER_MODES[session.mode].seconds),
                completed: Boolean(session.completed),
                reason: String(session.reason || ''),
            }));
        } catch (e) {
            logError(e, 'ORBIT could not load study session history');
            this._studySessions = [];
        }
    }

    _saveStudySessions() {
        try {
            const parent = this._sessionFile.get_parent();
            parent.make_directory_with_parents(null);
            this._sessionFile.replace_contents(
                new TextEncoder().encode(JSON.stringify(this._studySessions, null, 2)),
                null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null,
            );
        } catch (e) {
            logError(e, 'ORBIT could not save study session history');
        }
    }

    _formatStudyDuration(seconds) {
        const total = Math.max(0, Math.floor(seconds || 0));
        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const remaining = total % 60;
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m`;
        return `${remaining}s`;
    }

    _localDateKey(timestamp) {
        const date = new Date(Number(timestamp));
        return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
    }

    _renderStudyTracker() {
        if (!this._studyLogList || !this._productiveHoursList)
            return;
        const now = Date.now();
        const todayKey = this._localDateKey(now);
        const today = (this._studySessions || []).filter(session => this._localDateKey(session.endedAtMs) === todayKey);
        const focusToday = today.filter(session => session.mode === 'focus');
        const breaksToday = today.filter(session => session.mode === 'short' || session.mode === 'long');
        const focusSeconds = focusToday.reduce((sum, session) => sum + session.durationSeconds, 0);
        const breakSeconds = breaksToday.reduce((sum, session) => sum + session.durationSeconds, 0);
        if (this._focusTodayValue) this._focusTodayValue.set_text(this._formatStudyDuration(focusSeconds));
        if (this._breakTodayValue) this._breakTodayValue.set_text(this._formatStudyDuration(breakSeconds));
        if (this._focusSessionsValue) this._focusSessionsValue.set_text(String(focusToday.length));

        this._productiveHoursList.destroy_all_children();
        const hourBuckets = new Map();
        for (const session of focusToday) {
            const hour = new Date(session.startedAtMs).getHours();
            hourBuckets.set(hour, (hourBuckets.get(hour) || 0) + session.durationSeconds);
        }
        if (hourBuckets.size === 0) {
            this._productiveHoursList.add_child(this._label('No focus time recorded yet today. Start a focus session to build your hour-by-hour list.', 'orbit-tracker-empty'));
        } else {
            const max = Math.max(1, ...Array.from(hourBuckets.values()));
            for (const [hour, seconds] of Array.from(hourBuckets.entries()).sort((a,b) => a[0]-b[0])) {
                const row = this._box(false, 'orbit-hour-row', { x_expand: true });
                const hourLabel = this._label(`${String(hour).padStart(2,'0')}:00`, 'orbit-hour-label');
                hourLabel.set_width(48);
                row.add_child(hourLabel);
                const track = new St.Widget({ style_class: 'orbit-hour-track', x_expand: true, layout_manager: new Clutter.BinLayout() });
                track.set_height(7);
                const fill = new St.Widget({ style_class: 'orbit-hour-fill' });
                fill.set_height(7);
                track.add_child(fill);
                const fraction = seconds / max;
                const resizeFill = () => fill.set_width(Math.max(3, Math.round(Math.max(0, track.width) * fraction)));
                track.connect('notify::width', resizeFill);
                resizeFill();
                row.add_child(track);
                row.add_child(this._label(this._formatStudyDuration(seconds), 'orbit-hour-value'));
                this._productiveHoursList.add_child(row);
            }
        }

        this._studyLogList.destroy_all_children();
        const recent = [...(this._studySessions || [])].sort((a,b) => b.endedAtMs - a.endedAtMs).slice(0, 10);
        if (!recent.length) {
            this._studyLogList.add_child(this._label('Your focus and break history will appear here after your first timer session.', 'orbit-tracker-empty'));
        } else {
            for (const session of recent) {
                const row = this._box(false, 'orbit-study-log-row', { x_expand: true });
                const modeName = session.mode === 'focus' ? 'FOCUS' : session.mode === 'short' ? 'SHORT BREAK' : 'LONG BREAK';
                row.add_child(this._label(modeName, session.mode === 'focus' ? 'orbit-log-mode orbit-log-focus' : 'orbit-log-mode orbit-log-break'));
                const detail = this._box(true, 'orbit-log-detail', { x_expand: true });
                const start = new Date(session.startedAtMs);
                const dateLine = this._localDateKey(session.startedAtMs) === todayKey
                    ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : `${String(start.getDate()).padStart(2,'0')} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][start.getMonth()]} · ${start.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
                detail.add_child(this._label(`${this._formatStudyDuration(session.durationSeconds)} · ${dateLine}`, 'orbit-log-main'));
                detail.add_child(this._label(session.completed ? 'COMPLETED' : 'INTERRUPTED / PARTIAL', 'orbit-log-sub'));
                row.add_child(detail);
                this._studyLogList.add_child(row);
            }
        }
    }

    _cyclePriority() {
        const index = PRIORITIES.indexOf(this._selectedPriority);
        this._selectedPriority = PRIORITIES[(index + 1) % PRIORITIES.length];
        this._priorityButton.set_label(`${this._selectedPriority} ▾`);
        this._priorityButton.set_style_class_name(`orbit-button orbit-priority-button orbit-priority-${this._selectedPriority.toLowerCase()}`);
    }

    _addTask() {
        if (!this._taskEntry)
            return;
        const text = this._taskEntry.get_text().trim();
        const due = this._taskDueEntry.get_text().trim();
        if (!text) {
            this._taskError.set_text('Enter a task before adding it.');
            return;
        }
        if (text.length > 120) {
            this._taskError.set_text('Keep task names under 120 characters.');
            return;
        }
        if (due && !this._isValidDate(due)) {
            this._taskError.set_text('Use a valid deadline in YYYY-MM-DD format, or leave it blank.');
            return;
        }

        this._tasks.unshift({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text,
            done: false,
            priority: this._selectedPriority,
            due: due || '',
            created: Date.now(),
        });
        this._taskEntry.set_text('');
        this._taskDueEntry.set_text('');
        if (this._calendarToggle) this._calendarToggle.set_label('▦ PICK DATE');
        if (this._calendarPanel) this._calendarPanel.visible = false;
        this._taskError.set_text('');
        if (this._taskComposer)
            this._taskComposer.visible = false;
        if (this._taskAddToggle)
            this._taskAddToggle.set_label('+ ADD TASK');
        this._saveTasks();
        this._renderTasks();
    }

    _isValidDate(value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
            return false;
        const date = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }

    _clearCompletedTasks() {
        this._tasks = this._tasks.filter(task => !task.done);
        this._saveTasks();
        this._renderTasks();
    }

    _renderTasks() {
        if (!this._taskList)
            return;
        this._taskList.destroy_all_children();
        const today = GLib.DateTime.new_now_local().format('%Y-%m-%d');
        const filteredTasks = this._tasks.filter(task => {
            if (this._taskFilter === 'completed')
                return task.done;
            if (this._taskFilter === 'upcoming')
                return !task.done && Boolean(task.due) && task.due > today;
            return !task.done && (!task.due || task.due <= today);
        });

        if (!filteredTasks.length) {
            const message = this._taskFilter === 'completed'
                ? 'Completed tasks will appear here.'
                : this._taskFilter === 'upcoming'
                    ? 'No upcoming deadlines yet.'
                    : 'A clear page. Add your first task.';
            this._taskList.add_child(this._label(message, 'orbit-empty-tasks'));
        }

        for (const task of filteredTasks) {
            const row = this._box(false, 'orbit-task-row', { x_expand: true });
            row.add_child(this._button(task.done ? '✓' : '○', () => {
                task.done = !task.done;
                this._saveTasks();
                this._renderTasks();
            }, task.done ? 'orbit-check done' : 'orbit-check'));

            const description = this._box(true, 'orbit-task-description', { x_expand: true });
            const taskLabel = this._label(task.text, task.done ? 'orbit-task-text completed' : 'orbit-task-text');
            taskLabel.clutter_text.line_wrap = true;
            description.add_child(taskLabel);
            if (task.due) {
                const overdue = !task.done && task.due < today;
                description.add_child(this._label(`${overdue ? 'OVERDUE' : 'DUE'}  ${task.due}`, overdue ? 'orbit-due orbit-overdue' : 'orbit-due'));
            }
            row.add_child(description);
            row.add_child(this._label(task.priority, `orbit-priority-tag orbit-priority-${String(task.priority).toLowerCase()}`));
            row.add_child(this._button('×', () => {
                const index = this._tasks.indexOf(task);
                if (index >= 0)
                    this._tasks.splice(index, 1);
                this._saveTasks();
                this._renderTasks();
            }, 'orbit-remove'));
            this._taskList.add_child(row);
        }

        const complete = this._tasks.filter(task => task.done).length;
        const total = this._tasks.length;
        const open = total - complete;
        const progress = total ? Math.round((complete / total) * 100) : 0;
        this._taskCount.set_text(`${open} OPEN  •  ${complete}/${total} DONE`);
        this._taskProgressLabel.set_text(`${progress}% COMPLETE`);
        this._progressRatio = progress / 100;
        this._updateProgressBar();
    }

    _updateProgressBar() {
        if (!this._progressTrack || !this._progressFill)
            return;
        const width = Math.max(0, this._progressTrack.width - 2);
        this._progressFill.set_size(Math.round(width * (this._progressRatio || 0)), 5);
    }

    _loadTasks() {
        try {
            const [ok, contents] = this._taskFile.load_contents(null);
            if (!ok)
                return;
            const parsed = JSON.parse(new TextDecoder().decode(contents));
            if (!Array.isArray(parsed))
                return;
            this._tasks = parsed
                .filter(task => task && typeof task.text === 'string' && task.text.trim())
                .map((task, index) => ({
                    id: String(task.id ?? `restored-${index}`),
                    text: task.text.slice(0, 120),
                    done: Boolean(task.done),
                    priority: PRIORITIES.includes(task.priority) ? task.priority : 'MEDIUM',
                    due: typeof task.due === 'string' && this._isValidDate(task.due) ? task.due : '',
                    created: Number(task.created) || Date.now(),
                }));
        } catch (_) {
            this._tasks = [];
        }
    }

    _saveTasks() {
        try {
            const parent = this._taskFile.get_parent();
            parent.make_directory_with_parents(null);
            this._taskFile.replace_contents(
                new TextEncoder().encode(JSON.stringify(this._tasks, null, 2)),
                null,
                false,
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                null,
            );
        } catch (e) {
            logError(e, 'ORBIT could not save the local task file');
            if (this._taskError)
                this._taskError.set_text('Could not save tasks. Check folder permissions.');
        }
    }

    _renderKural() {
        if (!this._kuralTamil)
            return;
        const kural = KURALS[this._kuralIndex];
        this._kuralNumber.set_text(`KURAL  ${kural.number}  /  ${this._kuralIndex + 1} OF ${KURALS.length}`);
        this._kuralTamil.set_text(kural.tamil);
        this._kuralMeaning.set_text(kural.meaning);
        this._kuralNote.set_text(kural.note);
    }

    _changeKural(direction) {
        this._kuralIndex = (this._kuralIndex + direction + KURALS.length) % KURALS.length;
        this._renderKural();
    }

    _findPhotos() {
        const path = GLib.build_filenamev([GLib.get_home_dir(), 'Pictures', 'ORBIT-Memories']);
        const directory = Gio.File.new_for_path(path);
        const results = [];
        try {
            directory.make_directory_with_parents(null);
        } catch (_) { }
        let enumerator = null;
        try {
            enumerator = directory.enumerate_children('standard::name,standard::type', Gio.FileQueryInfoFlags.NONE, null);
            let info;
            while ((info = enumerator.next_file(null)) !== null) {
                const name = info.get_name();
                if (info.get_file_type() === Gio.FileType.REGULAR && SUPPORTED_PHOTO.test(name))
                    results.push(directory.get_child(name).get_path());
            }
        } catch (_) {
            // The empty-photo state below gives users a clear next step.
        } finally {
            if (enumerator) {
                try { enumerator.close(null); } catch (_) { }
            }
        }
        return results.sort((a, b) => a.localeCompare(b));
    }

    _nextPhoto(animate = true) {
        if (!this._photo)
            return;
        this._photos = this._findPhotos();
        if (!this._photos.length) {
            this._photo.set_style('background-image: none;');
            this._photoPlaceholder.visible = true;
            this._photoCaption.set_text('ADD PHOTOS TO  Pictures / ORBIT-Memories');
            if (this._photoThumbRow)
                this._photoThumbRow.visible = false;
            return;
        }
        const path = this._photos[this._photoIndex % this._photos.length];
        this._photoIndex = (this._photoIndex + 1) % this._photos.length;
        const uri = Gio.File.new_for_path(path).get_uri();
        const applyPhoto = () => {
            if (!this._photo)
                return;
            this._photo.set_style(`background-image: url("${uri}"); background-size: cover; background-position: center;`);
            this._photoPlaceholder.visible = false;
            this._photo.set_opacity(255);
            this._currentPhotoPath = path;
            this._photoCaption.set_text(`${this._photos.length} PHOTO${this._photos.length === 1 ? '' : 'S'}  •  ROTATING MEMORIES`);
            this._updatePhotoThumbnails();
        };
        if (animate && this._photo.get_parent()) {
            this._photo.ease({
                opacity: 0,
                duration: 180,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                onComplete: applyPhoto,
            });
        } else {
            applyPhoto();
        }
    }

    _rescanPhotos() {
        const current = this._currentPhotoPath || '';
        this._photos = this._findPhotos();
        const currentIndex = this._photos.indexOf(current);
        this._photoIndex = currentIndex >= 0 ? currentIndex : 0;
        this._nextPhoto(false);
    }

    _previousPhoto() {
        this._photos = this._findPhotos();
        if (!this._photos.length) {
            this._nextPhoto(false);
            return;
        }
        this._photoIndex = (this._photoIndex + this._photos.length - 2) % this._photos.length;
        this._nextPhoto(true);
    }

    _openMemoriesFolder() {
        const path = GLib.build_filenamev([GLib.get_home_dir(), 'Pictures', 'ORBIT-Memories']);
        try { Gio.File.new_for_path(path).make_directory_with_parents(null); } catch (_) { }
        try {
            Gio.AppInfo.launch_default_for_uri(Gio.File.new_for_path(path).get_uri(), null);
        } catch (e) {
            logError(e, 'ORBIT could not open the photo folder');
        }
    }

}