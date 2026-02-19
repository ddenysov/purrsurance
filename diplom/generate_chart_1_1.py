import sys
sys.path.insert(0, '/Users/dmytro.denysov/Work/Sites/purrsurance/.pylibs')

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import numpy as np

years = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
adoption = [20, 47, 58, 50, 56, 50, 55, 72]

fig, ax = plt.subplots(figsize=(10, 5.5))

ax.plot(years, adoption, color='#2563EB', linewidth=2.5, marker='o',
        markersize=8, markerfacecolor='#2563EB', markeredgecolor='white',
        markeredgewidth=2, zorder=5)

ax.fill_between(years, adoption, alpha=0.10, color='#2563EB')

for x, y in zip(years, adoption):
    ax.annotate(f'{y}%',
                xy=(x, y),
                xytext=(0, 14),
                textcoords='offset points',
                ha='center', va='bottom',
                fontsize=11, fontweight='bold', color='#1e3a5f')

ax.set_xlabel('Рік', fontsize=12, labelpad=10)
ax.set_ylabel('Частка організацій, %', fontsize=12, labelpad=10)
ax.set_title('Частка організацій, що впровадили хоча б одну функцію ШІ, %',
             fontsize=13, fontweight='bold', pad=15)

ax.set_xticks(years)
ax.set_xticklabels([str(y) for y in years], fontsize=11)
ax.set_ylim(0, 85)
ax.yaxis.set_major_locator(mticker.MultipleLocator(10))
ax.tick_params(axis='y', labelsize=10)

ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)
ax.spines['left'].set_color('#cccccc')
ax.spines['bottom'].set_color('#cccccc')
ax.grid(axis='y', linestyle='--', alpha=0.4, color='#999999')

ax.annotate('Поява ChatGPT\n(листопад 2022)',
            xy=(2022.5, 52.5), xytext=(2020.3, 72),
            fontsize=9, color='#555555', ha='center',
            arrowprops=dict(arrowstyle='->', color='#888888', lw=1.2))

fig.text(0.98, 0.01, 'Джерело: McKinsey Global Survey on AI, 2017–2024 [1]',
         ha='right', va='bottom', fontsize=8.5, color='#888888', style='italic')

plt.tight_layout()
plt.savefig('/Users/dmytro.denysov/Work/Sites/purrsurance/diplom/fig_1_1.png',
            dpi=200, bbox_inches='tight', facecolor='white')
plt.close()
print('Chart saved to diplom/fig_1_1.png')
