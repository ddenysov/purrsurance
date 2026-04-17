import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')

plt.rcParams['font.family'] = 'DejaVu Sans'

categories = [
    'Андерайтинг',
    'Персоналізація\nпродуктів',
    'Виявлення\nшахрайства',
    'Обробка\nпретензій',
    'Обслуговування\nклієнтів',
]
values = [14, 24, 32, 39, 47]

fig, ax = plt.subplots(figsize=(10, 5.5))

colors = ['#1565C0', '#1976D2', '#1E88E5', '#2196F3', '#42A5F5']

bars = ax.barh(categories, values, color=colors, height=0.6, edgecolor='white', linewidth=0.5)

for bar, val in zip(bars, values):
    ax.text(bar.get_width() + 1.2, bar.get_y() + bar.get_height()/2,
            f'{val}%', va='center', ha='left', fontsize=13, fontweight='bold', color='#1565C0')

ax.set_xlim(0, 58)
ax.set_xlabel('Частка страхових компаній, що впровадили AI, %', fontsize=11, color='#333333', labelpad=10)
ax.set_title('Структура впровадження AI-рішень у страхових компаніях\nза функціональними напрямами у 2024 р.',
             fontsize=14, fontweight='bold', color='#1a3a5c', pad=15)

ax.tick_params(axis='y', labelsize=11, colors='#333333')
ax.tick_params(axis='x', labelsize=10, colors='#666666')

ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_visible(False)
ax.spines['bottom'].set_color('#cccccc')

ax.xaxis.grid(True, linestyle='--', alpha=0.3, color='#999999')
ax.set_axisbelow(True)

ax.tick_params(axis='y', length=0)

fig.text(0.98, 0.02, 'Джерело: Accenture Technology Vision, 2024 [10]',
         ha='right', va='bottom', fontsize=9, fontstyle='italic', color='#888888')

plt.tight_layout()
plt.savefig('/Users/dmytro.denysov/Work/Sites/purrsurance/diplom/fig_1_3.png', dpi=200, bbox_inches='tight',
            facecolor='white', edgecolor='none')
print('Figure saved as fig_1_3.png')
